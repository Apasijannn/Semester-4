import modal

app = modal.App("medqa-qwen")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch", "transformers", "peft", "trl",
        "accelerate", "bitsandbytes", "datasets", "pyyaml",
    )
    .env({"PYTORCH_CUDA_ALLOC_CONF": "expandable_segments:True"})
)

data_vol = modal.Volume.from_name("medqa-data", create_if_missing=True)
out_vol = modal.Volume.from_name("medqa-output", create_if_missing=True)

MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"
MAX_SEQ_LENGTH = 1536
OUT_DIR = "/output/qwen-id-lora"


@app.function(
    image=image,
    gpu="A100-40GB",
    timeout=6 * 60 * 60,
    volumes={"/data": data_vol, "/output": out_vol},
)
def train(subset: int):
    import os
    import torch
    from datasets import load_dataset
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from trl import SFTConfig, SFTTrainer

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    def render(ex):
        msgs = ex["messages"]
        if msgs[0]["role"] == "system":
            msgs = [{"role": "user", "content": msgs[0]["content"] + "\n\n" + msgs[1]["content"]}] + msgs[2:]
        return {"text": tokenizer.apply_chat_template(msgs, tokenize=False)}

    ds = load_dataset("json", data_files="/data/train.jsonl", split="train")
    ds = ds.shuffle(seed=42).select(range(subset))
    ds = ds.map(render, remove_columns=ds.column_names)
    ds = ds.train_test_split(test_size=0.02, seed=42)

    bnb = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
    )
    base = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        quantization_config=bnb,
        device_map={"": 0},
        dtype=torch.bfloat16,
    )
    base.config.use_cache = False
    base = prepare_model_for_kbit_training(base, use_gradient_checkpointing=True)
    base = get_peft_model(base, LoraConfig(
        r=16, lora_alpha=32, lora_dropout=0.05, bias="none",
        task_type="CAUSAL_LM", target_modules="all-linear",
    ))

    args = SFTConfig(
        output_dir=OUT_DIR,
        dataset_text_field="text",
        max_length=MAX_SEQ_LENGTH,
        num_train_epochs=1,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=8,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_ratio=0.03,
        optim="paged_adamw_8bit",
        bf16=True,
        gradient_checkpointing=True,
        gradient_checkpointing_kwargs={"use_reentrant": False},
        logging_steps=20,
        eval_strategy="steps",
        eval_steps=200,
        save_strategy="steps",
        save_steps=200,
        save_total_limit=3,
        report_to="none",
        seed=42,
    )
    trainer = SFTTrainer(
        model=base, args=args,
        train_dataset=ds["train"], eval_dataset=ds["test"],
        processing_class=tokenizer,
    )

    resume = None
    if os.path.isdir(OUT_DIR):
        cks = [d for d in os.listdir(OUT_DIR) if d.startswith("checkpoint-")]
        if cks:
            resume = os.path.join(OUT_DIR, max(cks, key=lambda x: int(x.split("-")[-1])))

    trainer.train(resume_from_checkpoint=resume)
    trainer.save_model(OUT_DIR)
    tokenizer.save_pretrained(OUT_DIR)
    out_vol.commit()


@app.local_entrypoint()
def main(subset: int = 15000):
    train.remote(subset)

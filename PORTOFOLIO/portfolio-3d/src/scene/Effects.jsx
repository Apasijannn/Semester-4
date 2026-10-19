import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/*
  Post-processing tipis (desktop saja — dilewati di mobile demi performa):
  - Bloom halus: hanya menangkap highlight terang (refleksi metalik + aksen)
  - Vignette subtle di tepi frame
  - Tone mapping ACES Filmic untuk hasil sinematik
*/
export default function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom intensity={0.55} luminanceThreshold={0.75} luminanceSmoothing={0.2} mipmapBlur />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

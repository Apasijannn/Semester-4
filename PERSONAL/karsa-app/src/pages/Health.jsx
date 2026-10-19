import { useHealth } from '../hooks/useHealth'
import { useSettings } from '../hooks/useSettings'
import { useHealthInsight } from '../hooks/useHealthInsight'
import { StreakCounter } from '../components/health/StreakCounter'
import { WeeklyActivityChart } from '../components/health/WeeklyActivityChart'
import { SleepCard } from '../components/health/SleepCard'
import { HydrationCard } from '../components/health/HydrationCard'
import { NutritionCard } from '../components/health/NutritionCard'
import { AIInsightCard } from '../components/health/AIInsightCard'
import { ExerciseSection } from '../components/exercise/ExerciseSection'
import { HYDRATION_GOAL_GLASSES } from '../utils/healthGoals'

export function Health() {
  const { todayLog, updateToday, toggleMeal, streak, weeklyActivity, recentSleepHours } = useHealth()
  const { apiKey, model } = useSettings()

  const healthData = {
    sleepHours: recentSleepHours,
    hydrationToday: todayLog.waterGlasses,
    hydrationGoal: HYDRATION_GOAL_GLASSES,
    mealsChecked: todayLog.meals,
    habitStreak: streak,
    weeklyActivity: weeklyActivity.map((d) => d.level),
  }

  const { insight, status, generate, hasApiKey } = useHealthInsight(healthData, { apiKey, model })

  return (
    <div>
      <div className="mb-8 border-b-2 border-primary pb-4 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-primary">Health Log</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Track your daily meatbag maintenance.</p>
        </div>
        <div className="bg-tertiary-container text-on-tertiary-container px-3 py-1 font-label-caps text-label-caps border border-primary transform rotate-2">
          Status: {streak > 0 ? 'Optimal' : 'Needs Attention'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-grid-gutter">
        <StreakCounter streak={streak} />
        <WeeklyActivityChart
          weeklyActivity={weeklyActivity}
          exercised={todayLog.exercised}
          onToggleExercise={() => updateToday({ exercised: !todayLog.exercised })}
        />
        <SleepCard sleepHours={todayLog.sleepHours} onChange={(sleepHours) => updateToday({ sleepHours })} />
        <HydrationCard waterGlasses={todayLog.waterGlasses} onChange={(waterGlasses) => updateToday({ waterGlasses })} />
        <NutritionCard meals={todayLog.meals} onToggleMeal={toggleMeal} />

        <AIInsightCard insight={insight} status={status} hasApiKey={hasApiKey} onRefresh={generate} />
      </div>

      <ExerciseSection />
    </div>
  )
}

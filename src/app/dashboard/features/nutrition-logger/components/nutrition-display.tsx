"use client";

import { NutritionMeal } from "../types";
import { getUserLocalDate } from "../utils/date";
import DailyView from "./daily-view";
import WeeklyView from "./weekly-view";
import NutritionAnalytics from "./nutrition-analytics";

interface NutritionDisplayProps {
  meals: NutritionMeal[];
  viewType: "daily" | "weekly" | "analytics";
  onDeleteMeal: (mealId: string) => void;
}

export default function NutritionDisplay({
  meals,
  viewType,
  onDeleteMeal,
}: NutritionDisplayProps) {
  const today = getUserLocalDate();
  const dailyMeals = meals.filter((meal) => meal.date === today);

  const sortByMealType = (meals: NutritionMeal[]) => {
    const mealTypeOrder = {
      breakfast: 0,
      lunch: 1,
      dinner: 2,
      snack: 3,
    };

    return [...meals].sort(
      (a, b) => mealTypeOrder[a.meal_type] - mealTypeOrder[b.meal_type]
    );
  };

  const calculateDailyTotals = (meals: NutritionMeal[]) => {
    return meals.reduce(
      (totals, meal) => {
        meal.nutrition_food_items.forEach((item) => {
          totals.calories += item.calories;
          totals.protein += item.protein;
          totals.carbs += item.carbs;
          totals.fat += item.fat;
        });
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  if (viewType === "weekly") {
    return <WeeklyView meals={meals} onDeleteMeal={onDeleteMeal} />;
  }

  if (viewType === "analytics") {
    return <NutritionAnalytics />;
  }

  return (
    <DailyView
      meals={sortByMealType(dailyMeals)}
      nutritionTotals={calculateDailyTotals(dailyMeals)}
      onDeleteMeal={onDeleteMeal}
    />
  );
}

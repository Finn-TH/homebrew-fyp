import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  createOpenAIClient,
  OPENAI_CONSTANTS,
  SYSTEM_PROMPTS,
  ConversationType,
} from "@/lib/ai/openai/openai";
import {
  BUDGET,
  WORKOUT,
  JOURNAL,
  NUTRITION,
  HABITS,
  TODOS,
} from "@/lib/db/schema";
import { executeQuery } from "./query-builder";

// Define database functions based on our schema
const functions = [
  {
    name: "query_budget",
    description:
      "Query budget related data including transactions, categories, and savings goals",
    parameters: {
      type: "object",
      properties: {
        table: {
          type: "string",
          enum: Object.values(BUDGET.TABLES),
          description: "The budget table to query",
        },
        select: {
          type: "string",
          description: "Comma-separated columns to select",
          default: "*",
        },
        filters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: {
                type: "string",
                enum: [
                  "id",
                  "user_id",
                  "category_id",
                  "type",
                  "amount",
                  "description",
                  "date",
                  "created_at",
                  "updated_at",
                ],
              },
              operator: {
                type: "string",
                enum: ["eq", "gt", "lt", "gte", "lte", "between", "like"],
              },
              value: { type: "string" },
            },
          },
        },
        timeRange: {
          type: "object",
          properties: {
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" },
          },
        },
      },
      required: ["table"],
    },
  },
  {
    name: "query_workout",
    description:
      "Query workout related data including logs, exercises, and templates",
    parameters: {
      type: "object",
      properties: {
        table: {
          type: "string",
          enum: Object.values(WORKOUT.TABLES),
        },
        select: {
          type: "string",
          enum: Object.keys(WORKOUT.COLUMNS),
        },
        filters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: {
                type: "string",
                enum: [
                  ...Object.keys(WORKOUT.COLUMNS.exercises),
                  ...Object.keys(WORKOUT.COLUMNS.workout_logs),
                  ...Object.keys(WORKOUT.COLUMNS.workout_log_exercises),
                  ...Object.keys(WORKOUT.COLUMNS.workout_templates),
                  ...Object.keys(WORKOUT.COLUMNS.workout_template_exercises),
                ],
              },
            },
          },
        },
      },
    },
  },
  {
    name: "query_nutrition",
    description: "Query nutrition related data including meals and food items",
    parameters: {
      type: "object",
      properties: {
        table: {
          type: "string",
          enum: Object.values(NUTRITION.TABLES),
        },
        select: {
          type: "string",
          enum: Object.keys(NUTRITION.COLUMNS),
        },
        filters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: {
                type: "string",
                enum: [
                  ...Object.keys(NUTRITION.COLUMNS.nutri_common_foods),
                  ...Object.keys(NUTRITION.COLUMNS.nutrition_food_items),
                  ...Object.keys(NUTRITION.COLUMNS.nutrition_meals),
                ],
              },
            },
          },
        },
        nutritionRange: {
          type: "object",
          properties: {
            field: {
              type: "string",
              enum: NUTRITION.COMMON_FIELDS.nutritionFields,
            },
            min: { type: "number" },
            max: { type: "number" },
          },
        },
      },
    },
  },
  {
    name: "query_habits",
    description: "Query habits and habit tracking records",
    parameters: {
      type: "object",
      properties: {
        table: {
          type: "string",
          enum: Object.values(HABITS.TABLES),
        },
        select: {
          type: "string",
          enum: Object.keys(HABITS.COLUMNS),
        },
        filters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: {
                type: "string",
                enum: [
                  ...Object.keys(HABITS.COLUMNS.habits),
                  ...Object.keys(HABITS.COLUMNS.habit_records),
                ],
              },
            },
          },
        },
        statsFilter: {
          type: "object",
          properties: {
            field: {
              type: "string",
              enum: HABITS.COMMON_FIELDS.statsFields,
            },
            min: { type: "number" },
            max: { type: "number" },
          },
        },
      },
    },
  },
  {
    name: "query_todos",
    description: "Query todo items and their status",
    parameters: {
      type: "object",
      properties: {
        table: {
          type: "string",
          enum: Object.values(TODOS.TABLES),
        },
        select: {
          type: "string",
          enum: Object.keys(TODOS.COLUMNS),
        },
        filters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: {
                type: "string",
                enum: Object.keys(TODOS.COLUMNS.todos),
              },
            },
          },
        },
        completionStatus: {
          type: "string",
          enum: ["completed", "pending", "all"],
        },
        dueDateRange: {
          type: "object",
          properties: {
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
];

export async function POST(req: Request) {
  try {
    const { message, conversationHistory = [] } = await req.json();
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const openai = createOpenAIClient(process.env.OPENAI_API_KEY!);

    // First, determine conversation type
    const routerResponse = await openai.chat.completions.create({
      model: OPENAI_CONSTANTS.MODEL,
      temperature: 0.3, // Lower temperature for more consistent routing
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS.CONVERSATION_ROUTER,
        },
        ...conversationHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: message,
        },
      ],
    });

    const conversationType = JSON.parse(
      routerResponse.choices[0].message.content!
    ).type as ConversationType;

    // Handle based on conversation type
    if (conversationType === "FOLLOWUP") {
      // Use existing data from conversation history
      const analysisResponse = await openai.chat.completions.create({
        model: OPENAI_CONSTANTS.MODEL,
        temperature: OPENAI_CONSTANTS.TEMPERATURE,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS.DATA_ANALYSIS },
          ...conversationHistory,
          { role: "user", content: message },
        ],
      });

      return NextResponse.json({
        response: analysisResponse.choices[0].message.content,
        type: "FOLLOWUP",
      });
    }

    // For NEW_QUERY or CONTEXT_SWITCH, fetch fresh data
    const completion = await openai.chat.completions.create({
      model: OPENAI_CONSTANTS.MODEL,
      temperature: OPENAI_CONSTANTS.TEMPERATURE,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.FUNCTION_SELECTION },
        { role: "user", content: message },
      ],
      functions,
      function_call: "auto",
    });

    const functionCall = completion.choices[0].message.function_call;
    if (!functionCall) throw new Error("No function call received");

    // Execute query
    const args = JSON.parse(functionCall.arguments);
    if (!args.filters) args.filters = [];
    args.filters.push({ field: "user_id", operator: "eq", value: user.id });

    const { data: queryData, error: queryError } = await executeQuery(
      args,
      user.id
    );
    if (queryError) throw queryError;

    // Analysis with context
    const analysisResponse = await openai.chat.completions.create({
      model: OPENAI_CONSTANTS.MODEL,
      temperature: OPENAI_CONSTANTS.TEMPERATURE,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.DATA_ANALYSIS },
        ...conversationHistory,
        {
          role: "assistant",
          content: `New data retrieved: ${JSON.stringify(queryData)}`,
        },
        { role: "user", content: message },
      ],
    });

    return NextResponse.json({
      response: analysisResponse.choices[0].message.content,
      data: queryData,
      type: conversationType,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}

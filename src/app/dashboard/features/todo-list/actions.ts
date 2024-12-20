"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Todo, Priority } from "./types";

export async function addTodo(formData: FormData): Promise<void> {
  try {
    const title = formData.get("title") as string;
    const priority = formData.get("priority") as Priority;
    const dueDate = formData.get("due_date") as string | null;

    if (!title?.trim()) {
      throw new Error("Title is required");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase.from("todos").insert([
      {
        title: title.trim(),
        user_id: user.id,
        priority: priority || "medium",
        due_date: dueDate,
      },
    ]);

    if (error) throw error;
    revalidatePath("/dashboard/features/todo-list");
  } catch (error) {
    console.error("Failed to add todo:", error);
    throw error;
  }
}

export async function toggleTodo(id: string): Promise<Todo | null> {
  const supabase = await createClient();
  const { data: todo } = (await supabase
    .from("todos")
    .select("completed")
    .eq("id", id)
    .single()) as { data: Todo };

  const { data } = await supabase
    .from("todos")
    .update({ completed: !todo?.completed })
    .eq("id", id)
    .select()
    .single();

  revalidatePath("/dashboard/features/todo-list");
  return data as Todo;
}

export async function deleteTodo(id: string) {
  const supabase = await createClient();
  await supabase.from("todos").delete().eq("id", id);
  revalidatePath("/dashboard/features/todo-list");
}

export async function updatePriority(
  id: string,
  priority: Priority
): Promise<Todo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("todos")
    .update({ priority })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update priority:", error);
    throw error;
  }

  revalidatePath("/dashboard/features/todo-list");
  return data as Todo;
}

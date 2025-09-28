import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM tasks ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description }: { title: string; description?: string } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const [result]: any = await pool.query(
      "INSERT INTO tasks (title, description) VALUES (?, ?)",
      [title, description || null]
    );
    const newTask = { id: result.insertId, title, description: description || null };
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, completed } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Build the query dynamically based on what fields are provided
    const fields = [];
    const values = [];
    if (title !== undefined) {
      fields.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
        fields.push("description = ?");
        values.push(description);
    }
    if (completed !== undefined) {
      fields.push("completed = ?");
      values.push(completed);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id); // for the WHERE clause

    const query = `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`;
    await pool.query(query, values);

    return NextResponse.json({ message: `Task ${id} updated successfully` });
  } catch (error) {
    console.error("PATCH Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }
    await pool.query("DELETE FROM tasks WHERE id = ?", [id]);
    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("DELETE Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
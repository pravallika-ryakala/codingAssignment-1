const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("successful");
    });
  } catch (e) {
    console.log(`error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const convert = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};
const statusCheck = (status) => {
  return status === "TO DO" || status === "IN PROGRESS" || status === "DONE";
};
const priorityCheck = (priority) => {
  return priority === "HIGH" || priority === "MEDIUM" || priority === "LOW";
};
const categoryCheck = (category) => {
  return category === "WORK" || category === "HOME" || category === "LEARNING";
};
app.get("/todos/", async (request, response) => {
  const { search_q = "", category, status, priority } = request.query;
  let dbQuery;
  let c = 0;
  let text;
  if (status !== undefined && priority !== undefined) {
    if (statusCheck(status)) {
      if (priorityCheck(priority)) {
        dbQuery = `
                SELECT * FROM todo WHERE status='${status}' AND priority='${priority}';
        `;
      } else {
        c = 1;
        text = "Invalid Todo Priority";
      }
    } else {
      c = 1;
      text = "Invalid Todo Status";
    }
  } else if (status !== undefined && category !== undefined) {
    if (statusCheck(status)) {
      if (categoryCheck(category)) {
        dbQuery = `
                SELECT * FROM todo WHERE status='${status}' AND category='${category}';
                `;
      } else {
        c = 1;
        text = "Invalid Todo Category";
      }
    } else {
      c = 1;
      text = "Invalid Todo Status";
    }
  } else if (priority !== undefined && category !== undefined) {
    if (priorityCheck(priority)) {
      if (categoryCheck(category)) {
        dbQuery = `
            SELECT * FROM todo WHERE priority='${priority}' AND category='${category}';
            `;
      } else {
        c = 1;
        text = "Invalid Todo Category";
      }
    } else {
      c = 1;
      text = "Invalid Todo Priority";
    }
  } else if (status !== undefined) {
    if (statusCheck(status)) {
      dbQuery = `
      SELECT * FROM todo WHERE status='${status}';
      `;
    } else {
      text = "Invalid Todo Status";
      c = 1;
    }
  } else if (priority !== undefined) {
    if (priorityCheck(priority)) {
      dbQuery = `
            SELECT * FROM todo WHERE priority='${priority}';
      `;
    } else {
      text = "Invalid Todo Priority";
      c = 1;
    }
  } else if (category !== undefined) {
    if (categoryCheck(category)) {
      dbQuery = `
            SELECT * FROM todo WHERE category='${category}';
            `;
    } else {
      text = "Invalid Todo Category";
      c = 1;
    }
  } else {
    dbQuery = `
            SELECT * FROM todo WHERE todo LIKE "%${search_q}%";
            `;
  }
  if (c === 0) {
    const dbResponse = await db.all(dbQuery);
    response.send(dbResponse.map((each) => convert(each)));
  } else {
    response.status(400);
    response.send(text);
  }
});

//API2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `
        SELECT * FROM todo WHERE id=${todoId};
    `;
  const dbResponse = await db.get(todoQuery);
  response.send(convert(dbResponse));
});

//API3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const todoQuery = `
        SELECT * FROM todo WHERE due_date='${newDate}';
    `;
    const dbResponse = await db.all(todoQuery);
    response.send(dbResponse.map((each) => convert(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let text;
  let c = 0;
  if (priorityCheck(priority)) {
    if (statusCheck(status)) {
      if (categoryCheck(category)) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          c = 1;
          const updateQuery = `
                            INSERT INTO todo( id,
                            todo,
                            priority,
                            status,
                            category,
                            due_date) 
                            VALUES(
                                ${id},
                            '${todo}',
                            '${priority}',
                            '${status}',
                            '${category}',
                            '${dueDate}');
                        `;
          await db.run(updateQuery);
          response.send("Todo Successfully Added");
        } else {
          text = "Invalid Due Date";
        }
      } else {
        text = "Invalid Todo Category";
      }
    } else {
      text = "Invalid Todo Status";
    }
  } else {
    text = "Invalid Todo Priority";
  }
  if (c === 0) {
    response.status(400);
    response.send(text);
  }
});

//API5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let dbQuery;
  let text;
  let c = 0;
  if (status !== undefined) {
    if (statusCheck(status)) {
      c = 1;
      dbQuery = `
            UPDATE todo
            SET
            status='${status}'
            WHERE id=${todoId};
          `;
      text = "Status Updated";
    } else {
      text = "Invalid Todo Status";
    }
  } else if (priority !== undefined) {
    if (priorityCheck(priority)) {
      c = 1;
      dbQuery = `
            UPDATE todo
            SET
            priority='${priority}'
            WHERE id=${todoId};
          `;
      text = "Priority Updated";
    } else {
      text = "Invalid Todo Priority";
    }
  } else if (category !== undefined) {
    if (categoryCheck(category)) {
      c = 1;
      dbQuery = `
            UPDATE todo
            SET
            category='${category}'
            WHERE id=${todoId};
          `;
      text = "Category Updated";
    } else {
      text = "Invalid Todo Category";
    }
  } else if (dueDate !== undefined) {
    if (isMatch(dueDate, "yyyy-MM-dd")) {
      c = 1;
      dbQuery = `
                UPDATE todo
                    SET
                    due_date='${dueDate}'
                    WHERE id=${todoId};
            `;
      text = "Due Date Updated";
    } else {
      text = "Invalid Due Date";
    }
  } else if (todo !== undefined) {
    c = 1;
    dbQuery = `
            UPDATE todo
            SET
            todo='${todo}'
            WHERE id=${todoId};
          `;
    text = "Todo Updated";
  }
  if (c === 1) {
    await db.run(dbQuery);
    response.send(text);
  } else {
    response.status(400);
    response.send(text);
  }
});

//API6
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const dbQuery = `
        DELETE FROM todo
        WHERE id=${todoId};
    `;
  await db.run(dbQuery);
  response.send("Todo Deleted");
});
module.exports = app;

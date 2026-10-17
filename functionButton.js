const inputNewTask = document.getElementById("inputNewTask");
const taskBar = document.getElementById("taskBar");
const taskNameInput = document.getElementById("inputNewTaskName");
const inputNewTaskButton = document.getElementById("inputNewTaskButton");
const inputNewTaskForm = document.getElementById("inputNewTaskForm");
const taskSheetContainer = document.querySelector(".taskSheetContainer");

const STORAGE_KEY = "taskManagerData";
const sheetLineCount = 60;
const PRIORITY_ICONS = {
    common: '<i class="fa-solid fa-circle commonIcon"></i>',
    needToDo: '<i class="fa-solid fa-circle needToDoIcon"></i>',
    urgent: '<i class="fa-solid fa-circle urgentIcon"></i>'
};

let editingTask = null;
let taskIdCounter = 0;
let currentTaskId = null;
const taskSheets = {};

/* ------------------------------------------------------------------
   LOCAL STORAGE
------------------------------------------------------------------ */

function saveToStorage() {
    try {
        const data = {
            counter: taskIdCounter,
            currentTaskId: currentTaskId,
            tasks: Array.from(taskBar.querySelectorAll(".tasks")).map(t => ({
                id: t.dataset.id,
                name: t.dataset.name,
                priority: t.dataset.priority,
                sheet: taskSheets[t.dataset.id] || ""
            }))
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Không lưu được vào localStorage:", error);
    }
}

function loadFromStorage() {
    let data;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        data = JSON.parse(raw);
    } catch (error) {
        console.error("Không đọc được localStorage:", error);
        return false;
    }
    if (!data || !Array.isArray(data.tasks) || data.tasks.length === 0) return false;

    taskIdCounter = data.counter || 0;

    data.tasks.forEach(info => {
        taskSheets[info.id] = info.sheet || createEmptySheet();
        const taskEl = buildTaskElement(info.id, info.priority, info.name);
        taskBar.appendChild(taskEl);
    });

    const savedTask = data.currentTaskId
        ? taskBar.querySelector(`.tasks[data-id="${data.currentTaskId}"]`)
        : null;
    selectTask(savedTask || taskBar.querySelector(".tasks"));
    return true;
}

/* ------------------------------------------------------------------
   TẠO / HIỂN THỊ TASK
------------------------------------------------------------------ */

function renderTaskText(taskEl) {
    const textTask = taskEl.querySelector(".textTask");
    textTask.innerHTML = PRIORITY_ICONS[taskEl.dataset.priority] || "";
    textTask.append(" " + taskEl.dataset.name); // dùng text node, không chèn HTML
}

function buildTaskElement(id, priority, name) {
    const tasks = document.createElement("div");
    tasks.classList.add("tasks");
    tasks.dataset.id = id;
    tasks.dataset.priority = priority;
    tasks.dataset.name = name;

    const textTask = document.createElement("div");
    textTask.classList.add("textTask");

    const div = document.createElement("div");
    const iconTask = document.createElement("span");
    iconTask.classList.add("iconTask");
    iconTask.innerHTML = `<i class="fa-solid fa-ellipsis fa-sm"></i>`;

    const iconCommentContainer = document.createElement("ul");
    iconCommentContainer.classList.add("iconCommentContainer");
    iconCommentContainer.innerHTML = `<li><button class="iconComment addButton"><i class="fa-solid fa-plus"></i></button></li>
                            <li><button class="iconComment deleteButton"><i class="fa-solid fa-minus"></i></button></li>
                            <li><button class="iconComment moveUpButton"><i class="fa-solid fa-chevron-up"></i></button></li>
                            <li><button class="iconComment moveDownButton"><i class="fa-solid fa-chevron-down"></i></button></li>
                            <li><button class="iconComment priorityButton"><i class="fa-solid fa-arrow-up-short-wide"></i></button></li>`;

    tasks.appendChild(textTask);
    tasks.appendChild(div);
    div.appendChild(iconTask);
    div.appendChild(iconCommentContainer);

    renderTaskText(tasks);
    buttonFunction(tasks);
    attachTaskSelect(tasks);
    return tasks;
}

/* ------------------------------------------------------------------
   FORM THÊM / SỬA TASK
------------------------------------------------------------------ */

function addTask() {
    editingTask = null;
    inputNewTask.style.visibility = "visible";
    inputNewTaskButton.textContent = "Submit";
}

function hiddenTask() {
    editingTask = null;
    inputNewTask.style.visibility = "hidden";
    taskNameInput.value = "";
    inputNewTaskButton.textContent = "Submit";
}

inputNewTaskForm.addEventListener("submit", function (event) {
    event.preventDefault();
    submitButton();
})

function submitButton() {
    const selectedPriority = document.querySelector('input[name="inputNewTaskPriority"]:checked');
    const taskNameValue = taskNameInput.value.trim();
    if (taskNameValue === "") {
        alert("Fill the information for the name task");
        return;
    }
    else if (!selectedPriority) {
        alert("Choose the priority that you want");
        return;
    }

    const priorityValue = selectedPriority.value;
    inputNewTask.style.visibility = "hidden";

    if (editingTask == null) {
        const id = generateTaskId();
        taskSheets[id] = createEmptySheet();
        const tasks = buildTaskElement(id, priorityValue, taskNameValue);
        taskBar.appendChild(tasks);
        selectTask(tasks);
    }
    else {
        editingTask.dataset.priority = priorityValue;
        editingTask.dataset.name = taskNameValue;
        renderTaskText(editingTask);
    }

    taskNameInput.value = "";
    selectedPriority.checked = false;
    editingTask = null;
    saveToStorage();
}

function buttonFunction(taskObject) {
    inputNewTaskButton.textContent = "Submit";
    const addButton = taskObject.querySelector(".addButton");
    const deleteButton = taskObject.querySelector(".deleteButton");
    const moveUpButton = taskObject.querySelector(".moveUpButton");
    const moveDownButton = taskObject.querySelector(".moveDownButton");
    const priorityButton = taskObject.querySelector(".priorityButton");

    if (addButton) {
        addButton.addEventListener("click", () => {
            inputNewTask.style.visibility = "visible";
            editingTask = null;
        })
    }

    if (deleteButton) {
        deleteButton.addEventListener("click", () => {
            if (confirm("Do you want to delete the task ?")) {
                if (taskObject.dataset.id) {
                    delete taskSheets[taskObject.dataset.id];
                    if (currentTaskId === taskObject.dataset.id) {
                        currentTaskId = null;
                        taskSheetContainer.innerHTML = "";
                    }
                }
                taskObject.remove();
                saveToStorage();
            }
        })
    }

    if (moveUpButton) {
        moveUpButton.addEventListener("click", () => {
            const prevTaskObject = taskObject.previousElementSibling;
            if (prevTaskObject) {
                taskBar.insertBefore(taskObject, prevTaskObject);
                saveToStorage();
            }
            else {
                alert("The task has already been place at the top");
            }
        })
    }

    if (moveDownButton) {
        moveDownButton.addEventListener("click", () => {
            const nextTaskObject = taskObject.nextElementSibling;
            if (nextTaskObject) {
                taskBar.insertBefore(nextTaskObject, taskObject);
                saveToStorage();
            }
            else {
                alert("The task has already been place at the bottom");
            }
        })
    }

    if (priorityButton) {
        priorityButton.addEventListener("click", () => {
            openEditForm(taskObject);
        })
    }
}

function openEditForm(taskObject) {
    inputNewTask.style.visibility = "visible";
    editingTask = taskObject;
    taskNameInput.value = taskObject.dataset.name || "";

    const targetRadio = document.querySelector(
        `input[name="inputNewTaskPriority"][value="${taskObject.dataset.priority}"]`
    );
    if (targetRadio) {
        targetRadio.checked = true;
    }
    inputNewTaskButton.textContent = "Update";
}

/* ------------------------------------------------------------------
   TRANG GHI CHÚ CỦA TỪNG TASK
------------------------------------------------------------------ */

function generateTaskId() {
    taskIdCounter += 1;
    return `task-${Date.now()}-${taskIdCounter}`;
}

function createEmptySheet() {
    let html = "";
    for (let i = 0; i < sheetLineCount; i++) {
        html += "<div><br></div>";
    }
    return html;
}

function saveCurrentSheet() {
    if (currentTaskId !== null) {
        taskSheets[currentTaskId] = taskSheetContainer.innerHTML;
        saveToStorage();
    }
}

function selectTask(taskObject) {
    if (!taskObject || !taskObject.dataset.id || taskObject.dataset.id === currentTaskId) {
        return;
    }

    saveCurrentSheet();

    document.querySelectorAll(".tasks").forEach(t => t.classList.remove("activeTask"));
    taskObject.classList.add("activeTask");

    currentTaskId = taskObject.dataset.id;
    taskSheetContainer.innerHTML = taskSheets[currentTaskId] || createEmptySheet();
    saveToStorage();
}

function attachTaskSelect(taskObject) {
    const textTask = taskObject.querySelector(".textTask");
    if (textTask) {
        textTask.addEventListener("click", () => selectTask(taskObject));
    }
}

if (taskSheetContainer) {
    taskSheetContainer.addEventListener("input", saveCurrentSheet);
}

/* ------------------------------------------------------------------
   CHECKBOX TRONG VÙNG SOẠN THẢO
------------------------------------------------------------------ */

const ZWSP = "\u200B"; // ký tự vô hình, giữ cho span không bao giờ "rỗng"

function createCheckboxDiv() {
    const div = document.createElement("div");
    div.className = "checkboxDiv";
    div.innerHTML = `<input type="checkbox" class="checkboxTask"><span class="checkboxSpan">${ZWSP}</span>`;
    return div;
}

function placeCursorAtEnd(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

// Tìm dòng (con trực tiếp của vùng soạn thảo) đang chứa con trỏ
function getCurrentLine() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    let node = sel.anchorNode;
    while (node && node.parentNode !== taskSheetContainer) {
        node = node.parentNode;
    }
    return node && node.nodeType === 1 ? node : null;
}

function isEmptyCheckboxLine(line) {
    const span = line.querySelector(".checkboxSpan");
    if (!span) return true;
    return span.textContent.replace(/\u200B/g, "").trim() === "";
}

function replaceWithPlainLine(line) {
    const plain = document.createElement("div");
    plain.innerHTML = "<br>";
    line.replaceWith(plain);
    placeCursorAtEnd(plain);
}

taskSheetContainer.addEventListener("keydown", event => {
    const line = getCurrentLine();
    if (!line) return;
    const inCheckbox = line.classList.contains("checkboxDiv");

    if (event.key === "Tab") {
        event.preventDefault();
        if (inCheckbox) return;
        const newBox = createCheckboxDiv();
        const lineIsEmpty = line.textContent.trim() === "";
        if (lineIsEmpty) line.replaceWith(newBox);
        else line.after(newBox);
        placeCursorAtEnd(newBox.querySelector(".checkboxSpan"));
        saveCurrentSheet();
    }

    else if (event.key === "Enter" && inCheckbox) {
        event.preventDefault();
        if (isEmptyCheckboxLine(line)) {
            replaceWithPlainLine(line);          // Enter ở dòng trống = thoát danh sách
        } else {
            const newBox = createCheckboxDiv();  // Enter = tạo checkbox mới bên dưới
            line.after(newBox);
            placeCursorAtEnd(newBox.querySelector(".checkboxSpan"));
        }
        saveCurrentSheet();
    }

    else if (event.key === "Backspace" && inCheckbox && isEmptyCheckboxLine(line)) {
        event.preventDefault();                  // Backspace ở dòng trống = bỏ checkbox
        replaceWithPlainLine(line);
        saveCurrentSheet();
    }
});

// Lưu trạng thái tick vào HTML (innerHTML không tự ghi lại thuộc tính checked)
taskSheetContainer.addEventListener("change", event => {
    if (event.target.classList.contains("checkboxTask")) {
        event.target.toggleAttribute("checked", event.target.checked);
        saveCurrentSheet();
    }
});

/* ------------------------------------------------------------------
   KHỞI ĐỘNG: đọc dữ liệu đã lưu khi mở trang
   (script nằm cuối <body> nên DOM đã sẵn sàng)
------------------------------------------------------------------ */

loadFromStorage();
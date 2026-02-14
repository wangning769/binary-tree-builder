// ========== 节点类 ==========
class TreeNode {
  constructor(value, depth = 0) {
    this.value = value;
    this.depth = depth;
    this.left = null;
    this.right = null;
    this.x = 450;
    this.y = 100 + depth * 120;
    this.radius = 26;
    this.color = LEVEL_COLORS[depth % LEVEL_COLORS.length];
  }

  getSubtreeNodes() {
    const result = [this];
    if (this.left) result.push(...this.left.getSubtreeNodes());
    if (this.right) result.push(...this.right.getSubtreeNodes());
    return result;
  }
}

// ========== 配置 ==========
const LEVEL_COLORS = [
  "#FFB3BA",
  "#BAFFC9",
  "#BAA1AF",
  "#FFFFBA",
  "#E0BBE4",
  "#FFDFBA",
  "#B5EAD7",
  "#C7CEEA",
  "#F8B195",
  "#A2D9FF",
];

// ========== 全局状态 ==========
let rootNode = new TreeNode("Root", 0);
let selectedNode = rootNode;
const nodes = [rootNode];
let draggingNode = null;
let subtreeOffsets = [];
let editingNode = null;

// ========== DOM 元素 ==========
const canvas = document.getElementById("binaryTreeCanvas");
const ctx = canvas.getContext("2d");
const inlineEditor = document.getElementById("inlineEditor");
const jsonOutput = document.getElementById("jsonOutput");

// ========== 初始化 ==========
drawTree();

// ========== 事件绑定 ==========
canvas.addEventListener("click", handleCanvasClick);
canvas.addEventListener("dblclick", handleCanvasDblClick);
canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);

inlineEditor.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveEdit();
});
inlineEditor.addEventListener("blur", () => setTimeout(saveEdit, 100));

// ========== 交互处理 ==========
function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // 检查是否点击空白区域（用于保存编辑）
  let clickedOnNode = false;
  for (const node of nodes) {
    const dx = mouseX - node.x;
    const dy = mouseY - node.y;
    if (dx * dx + dy * dy <= node.radius * node.radius) {
      clickedOnNode = true;
      break;
    }
  }

  if (editingNode && !clickedOnNode) {
    saveEdit();
  }

  // 选中节点
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const dx = mouseX - node.x;
    const dy = mouseY - node.y;
    if (dx * dx + dy * dy <= node.radius * node.radius) {
      selectedNode = node;
      drawTree();
      return;
    }
  }
}

function handleCanvasDblClick(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const dx = mouseX - node.x;
    const dy = mouseY - node.y;
    if (dx * dx + dy * dy <= node.radius * node.radius) {
      startEditing(node, e.clientX, e.clientY);
      return;
    }
  }
}

function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const dx = mouseX - node.x;
    const dy = mouseY - node.y;
    if (dx * dx + dy * dy <= node.radius * node.radius) {
      draggingNode = node;
      const subtree = node.getSubtreeNodes();
      subtreeOffsets = subtree.map((n) => ({
        node: n,
        offsetX: n.x - node.x,
        offsetY: n.y - node.y,
      }));
      return;
    }
  }
}

function handleMouseMove(e) {
  if (!draggingNode) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (const { node, offsetX, offsetY } of subtreeOffsets) {
    node.x = mouseX + offsetX;
    node.y = mouseY + offsetY;
  }
  drawTree();
}

function handleMouseUp() {
  draggingNode = null;
  subtreeOffsets = [];
}

// ========== 编辑 ==========
function startEditing(node, clientX, clientY) {
  editingNode = node;
  inlineEditor.value = node.value || "";
  inlineEditor.style.display = "block";

  const canvasRect = canvas.getBoundingClientRect();
  inlineEditor.style.left = clientX - inlineEditor.offsetWidth / 2 + "px";
  inlineEditor.style.top = clientY - inlineEditor.offsetHeight / 2 + "px";

  inlineEditor.focus();
  inlineEditor.select();
}

function saveEdit() {
  if (!editingNode) return;
  const val = inlineEditor.value.trim();
  if (val !== "") {
    editingNode.value = val;
  }
  inlineEditor.style.display = "none";
  editingNode = null;
  drawTree();
}

// ========== 树操作 ==========
function addLeftNode() {
  if (!selectedNode) {
    alert("请先点击一个节点进行选中！");
    return;
  }
  if (selectedNode.left) {
    alert("该节点已有左子节点！");
    return;
  }
  const inputVal =
    document.getElementById("nodeValueInput").value.trim() || "New";
  const newNode = new TreeNode(inputVal, selectedNode.depth + 1);
  newNode.x = selectedNode.x - 100;
  newNode.y = selectedNode.y + 100;
  selectedNode.left = newNode;
  nodes.push(newNode);
  drawTree();
}

function addRightNode() {
  if (!selectedNode) {
    alert("请先点击一个节点进行选中！");
    return;
  }
  if (selectedNode.right) {
    alert("该节点已有右子节点！");
    return;
  }
  const inputVal =
    document.getElementById("nodeValueInput").value.trim() || "New";
  const newNode = new TreeNode(inputVal, selectedNode.depth + 1);
  newNode.x = selectedNode.x + 100;
  newNode.y = selectedNode.y + 100;
  selectedNode.right = newNode;
  nodes.push(newNode);
  drawTree();
}

function deleteSelectedNode() {
  if (!selectedNode) {
    alert("请先选中一个节点！");
    return;
  }
  if (selectedNode === rootNode && (rootNode.left || rootNode.right)) {
    alert("不能删除非空的根节点！");
    return;
  }

  const hasChildren = selectedNode.left || selectedNode.right;
  if (hasChildren && !confirm("该节点包含子节点，是否一并删除？")) {
    return;
  }

  // 移除子树节点
  const subtreeNodes = selectedNode.getSubtreeNodes();
  for (const node of subtreeNodes) {
    const index = nodes.indexOf(node);
    if (index !== -1) nodes.splice(index, 1);
  }

  // 断开父引用
  function findParent(root, target) {
    if (!root) return null;
    if (root.left === target || root.right === target) return root;
    return findParent(root.left, target) || findParent(root.right, target);
  }

  const parent = findParent(rootNode, selectedNode);
  if (parent) {
    if (parent.left === selectedNode) parent.left = null;
    else parent.right = null;
  } else {
    rootNode = null;
  }

  selectedNode = null;
  drawTree();
}

// ========== 绘图 ==========
function drawTree() {
  // 画布背景（幕布颜色）
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 连线
  function drawLines(node) {
    if (!node) return;
    if (node.left) {
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(node.left.x, node.left.y);
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 2;
      ctx.stroke();
      drawLines(node.left);
    }
    if (node.right) {
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(node.right.x, node.right.y);
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 2;
      ctx.stroke();
      drawLines(node.right);
    }
  }
  drawLines(rootNode);

  // 节点
  for (const node of nodes) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = node === selectedNode ? "#add8e6" : node.color;
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(String(node.value), node.x, node.y);
  }
}

// ========== JSON ==========
function generateJson() {
  function serialize(node) {
    if (!node) return null;
    return {
      value: node.value,
      left: serialize(node.left),
      right: serialize(node.right),
    };
  }
  const jsonStr = JSON.stringify(serialize(rootNode), null, 2);
  jsonOutput.textContent = jsonStr || "null";
}

function copyJson(isMinified = false) {
  let text = jsonOutput.textContent;
  if (text === "点击“生成 JSON”查看结果") {
    alert("请先点击“生成 JSON”按钮！");
    return;
  }

  if (isMinified) {
    try {
      text = JSON.stringify(JSON.parse(text));
    } catch (e) {
      alert("JSON 格式错误，无法压缩！");
      return;
    }
  }

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const btns = document.querySelectorAll(".btn-copy");
        const btn = isMinified ? btns[1] : btns[0];
        const orig = btn.textContent;
        btn.textContent = isMinified ? "✅ 已压缩复制！" : "✅ 已复制！";
        setTimeout(() => (btn.textContent = orig), 1500);
      })
      .catch(() => alert("复制失败，请手动复制。"));
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    alert(isMinified ? "已压缩复制到剪贴板！" : "已复制到剪贴板！");
  }
}

let problems = [];
let currentProblemIndex = 0;
let dragged = null;

async function loadProblems() {
  const params = new URLSearchParams(window.location.search);
  const spec = params.get('specification');

  if (!spec) {
    document.getElementById('problemPrompt').innerText = "No specification provided.";
    return;
  }

  try {
    const response = await fetch(spec);
    const data = await response.json();
    problems = data.problems;
    renderProblem(currentProblemIndex);
  } catch (error) {
    console.error("Error loading problem:", error);
  }
}

function renderProblem(index) {
  const problem = problems[index];
  document.getElementById('problemPrompt').textContent = problem.prompt;

  const blockPool = document.getElementById('blockPool');
  const slotArea = document.getElementById('slotArea');
  blockPool.innerHTML = "";
  slotArea.innerHTML = "";

  const mixedBlocks = [...problem.blocks, ...problem.distractors].sort(() => Math.random() - 0.5);

  mixedBlocks.forEach(block => {
    const div = document.createElement('div');
    div.className = 'block';
    div.id = block.id;
    div.textContent = block.code;
    div.draggable = true;
    div.addEventListener('dragstart', () => {
      dragged = div;
      div.classList.add('dragging');
    });
    div.addEventListener('dragend', () => {
      div.classList.remove('dragging');
    });
    blockPool.appendChild(div);
  });

  for (let i = 0; i < problem.blocks.length; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.index = i;

    slot.addEventListener('dragover', e => {
      e.preventDefault();
      slot.classList.add('hover');
    });
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('hover');
    });
    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('hover');
      if (slot.firstChild) {
        blockPool.appendChild(slot.firstChild);
      }
      slot.appendChild(dragged);
    });

    slotArea.appendChild(slot);
  }
}

window.checkAnswer = function () {
  const slots = document.querySelectorAll('.slot');
  const problem = problems[currentProblemIndex];
  let allCorrect = true;

  for (let i = 0; i < problem.blocks.length; i++) {
    const expectedId = problem.blocks[i].id;
    const slot = slots[i];
    const block = slot.firstChild;

    if (block && block.id === expectedId) {
      slot.style.backgroundColor = 'lightgreen';
    } else {
      slot.style.backgroundColor = 'lightcoral';
      allCorrect = false;
    }
  }

  if (allCorrect) {
    alert("✅ Correct!");
    currentProblemIndex++;
    if (currentProblemIndex < problems.length) {
      renderProblem(currentProblemIndex);
    } else {
      document.getElementById("certificateSection").style.display = "block";
    }
  } else {
    const poolChildren = [...document.getElementById('blockPool').children];
    const distractorIds = problem.distractors.map(d => d.id);
    const distractors = poolChildren.filter(b => distractorIds.includes(b.id));

    if (distractors.length > 0) {
      const randomDistractor = distractors[Math.floor(Math.random() * distractors.length)];
      randomDistractor.remove();
      console.log(`🧹 Removed distractor: ${randomDistractor.id}`);
    }
    console.log("❌ Try again.");
  }
};

function generateCertificate() {
  const studentName = document.getElementById("studentName").value;
  const activityName = document.getElementById("activityName").value;
  const message = document.getElementById("message");
  message.innerHTML = `${studentName} has completed ${activityName}.`;
  document.getElementById("certificate").style.display = "block";

  const htmlContent = `
    <div id="certificate" style="border: 2px solid #000; padding: 20px; font-family: Merriweather; text-align: center;">
      <h2>Congratulations!</h2>
      <p>${studentName} has completed ${activityName}.</p>
    </div>
  `;
  const blob = new Blob([htmlContent], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "certificate.html";
  link.click();
}

window.onload = () => loadProblems();

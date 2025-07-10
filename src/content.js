const tesseractScript = document.createElement('script');
tesseractScript.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4.0.2/dist/tesseract.min.js';
tesseractScript.onload = () => console.log("✅ Tesseract.js loaded via CDN");
document.head.appendChild(tesseractScript);


// Inject toolbar HTML
const toolbar = document.createElement("div");
toolbar.id = "rye-toolbar";
toolbar.innerHTML = `
  <button class="rye-btn" id="rye-start">🎙️ Start Interview</button>
  <button class="rye-btn" id="rye-ask">❓ Ask Question</button>
  <button class="rye-btn" id="rye-discuss">💬 Discuss</button>
`;
document.body.appendChild(toolbar);

// Add CSS
const style = document.createElement("link");
style.rel = "stylesheet";
style.href = chrome.runtime.getURL("toolbar.css");
document.head.appendChild(style);

// Preprocess image from screen
function preprocessImageData(video) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = data[i + 1] = data[i + 2] = avg;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

// OCR handler
async function handleOCR() {
  const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  const video = document.createElement("video");
  video.srcObject = mediaStream;
  await video.play();

  // Wait a bit for the screen to settle
  await new Promise(resolve => setTimeout(resolve, 1000));

  const preprocessedDataUrl = preprocessImageData(video);
  const { data: { text } } = await Tesseract.recognize(preprocessedDataUrl, "eng");

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  const rawTitleLine = lines.find(line => /^\d+\.\s+/.test(line));
  if (!rawTitleLine) {
    alert("❌ Could not find a LeetCode problem.");
    return;
  }

  const match = rawTitleLine.match(/^(\d+)\./);
  const problemNumber = match?.[1];

  if (problemNumber) {
    alert(`✅ Problem #${problemNumber} detected.`);
  } else {
    alert("❌ Could not extract problem number.");
  }

  mediaStream.getTracks().forEach(track => track.stop());
}

document.getElementById("rye-start").addEventListener("click", handleOCR);

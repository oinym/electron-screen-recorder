const {ipcRenderer}=require('electron')
const {writeFile}=require('fs')
let mediaRecorder;
let recordedChunks = [];

// Buttons
const videoElement = document.querySelector('video');

const recBtn = document.getElementById('recBtn');
recBtn.onclick = e => {
    console.log('start recording button pressed')
    startRecording();
  recBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');

stopBtn.onclick = e => {
  mediaRecorder.stop();
  recBtn.innerText = 'Start';
};

// const videoSelectBtn = document.getElementById('videoSelectBtn');
// videoSelectBtn.onclick = getVideoSources;

const selectMenu = document.getElementById('selectMenu')

async function getVideoSources() {
    const inputSources = await ipcRenderer.invoke('getSources')
  
    inputSources.forEach(source => {
      const element = document.createElement("li")
      const preview=document.createElement('img')
      const text=document.createElement('span')
        preview.src=source.thumbnail.toPNG();
      
      text.innerHTML =  source.name
      element.appendChild(preview)
      element.appendChild(text)
      element.value = source.id
      selectMenu.appendChild(element)
    });
  }


  async function startRecording() {
    getVideoSources();
    if(selectMenu.options[selectMenu.selectedIndex]){
        const screenId = selectMenu.options[selectMenu.selectedIndex].value
    
        // AUDIO WONT WORK ON MACOS
        const IS_MACOS = await ipcRenderer.invoke("getOperatingSystem") === 'darwin'
        console.log(await ipcRenderer.invoke('getOperatingSystem'))
        const audio = !IS_MACOS ? {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        } : false
      
        const constraints = {
          audio,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: screenId
            }
          }
        };
      
        // Create a Stream
        const stream = await navigator.mediaDevices
          .getUserMedia(constraints);
      
        // Preview the source in a video element
        videoElement.srcObject = stream;
        await videoElement.play();
      
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
        mediaRecorder.ondataavailable = onDataAvailable;
        mediaRecorder.onstop = stopRecording;
        mediaRecorder.start();
    }
    
  }

function onDataAvailable(e) {
    recordedChunks.push(e.data);
}


async function stopRecording() {
    videoElement.srcObject = null

    const blob = new Blob(recordedChunks, {
      type: 'video/webm; codecs=vp9'
    });
  
    const buffer = Buffer.from(await blob.arrayBuffer());
    recordedChunks = []

    const { canceled, filePath } =  await ipcRenderer.invoke('showSaveDialog')
    if(canceled) return
  
    if (filePath) {
      writeFile(filePath, buffer, () => console.log('video saved successfully!'));
    }
  }
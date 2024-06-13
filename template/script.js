// 修改appendMessageToChatBox函数，增加了isCode参数
function appendMessageToChatBox(sender, message, isCode = false) {
  var messageElement = document.createElement('div');
  messageElement.classList.add('message', sender + '-message');
  
  if (isCode) {
    // 创建<pre>和<code>元素以正确显示代码格式
    var preElement = document.createElement('pre');
    var codeElement = document.createElement('code');
    codeElement.textContent = message;
    
    // 将<code>元素作为子元素添加到<pre>中
    preElement.appendChild(codeElement);
    // 然后将<pre>作为子元素添加到消息元素中
    messageElement.appendChild(preElement);
  } else {
    // 对于非代码消息，直接设置文本内容
    messageElement.textContent = message;
  }
  
  // 获取聊天框元素并添加新的消息元素
  var chatBox = document.getElementById('chatBox');
  chatBox.appendChild(messageElement);
  // 自动滚动到聊天框的底部以显示最新消息
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
  var userInput = document.getElementById('userInput');
  var userMessage = userInput.value.trim();
  
  if (userMessage === '') {
      alert('Please enter a message.');
      return;
  }

  // 将消息添加到聊天框中
  appendMessageToChatBox('user', userMessage);

  if (userMessage.startsWith('画') || userMessage.startsWith('Paint ')) {
      var prompt = userMessage.slice(userMessage.indexOf(' ') + 1).trim();
      generateDALLEImage(prompt);
  } else {
      // 发送非代码消息到服务器
      fetch('http://localhost:5000/chat', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: userMessage })
      })
      .then(response => response.json())
      .then(data => {
          appendMessageToChatBox('bot', data.message);
      })
      .catch(error => {
          console.error('Error:', error);
          appendMessageToChatBox('bot', 'There was an error communicating with the server.');
      });
  }
  
  userInput.value = ''; // 清空输入框
}

function generateDALLEImage(prompt) {
  var imageContainer = document.createElement('div');
  imageContainer.classList.add('image-container');

  // Assuming chatBox is somehow available or retrieved earlier
  var chatBox = document.getElementById('chatBox');

  fetch('http://localhost:5000/dalle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: prompt })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.error) {
      console.error(data.error);
      imageContainer.textContent = 'Error generating image.';
    } else {
      var imageUrl = data.image;
      var imageElement = document.createElement('img');
      imageElement.src = imageUrl;

      // Set the desired width or height of the image
      imageElement.style.width = "25%"; // This makes the image responsive and fits its container
      // OR you could directly set a fixed size like:
      // imageElement.style.width = "256px";
      // imageElement.style.height = "auto"; // This maintains the aspect ratio
      imageElement.style.display = "block"; // this ensures it starts on a new line
      imageElement.style.marginTop = "12px"; // or as much space as you like

      imageElement.onload = function() {
        chatBox.appendChild(imageContainer);
      };
      imageElement.onerror = function() {
        imageContainer.textContent = 'Error loading image.';
        chatBox.appendChild(imageContainer);
      };
      imageContainer.appendChild(imageElement);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    imageContainer.textContent = 'Failed to generate image.';
    chatBox.appendChild(imageContainer);
  });
}
  
// 监听 Enter 键按下事件
document.getElementById('userInput').addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
});
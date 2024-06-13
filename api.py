from flask import Flask, request, jsonify, Response
from openai import OpenAI
import json
from flask_cors import CORS
from flask_socketio import SocketIO

# OpenAI API 配置
OPENAI_API_KEY = ''
Base_Url = 'https://api.openai.com/v1' # 默认请求地址https://api.openai.com/v1，可选其他反代

client = OpenAI(api_key=OPENAI_API_KEY, base_url=Base_Url)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')
    if not user_message:
        return Response(json.dumps({'error': 'No message provided'}, ensure_ascii=False), mimetype='application/json', status=400)
    
    try:
        # 发送请求到 OpenAI API
        api_response = client.chat.completions.create(
            model="gpt-3.5-turbo", # 默认gpt-3.5-turbo，可选gpt-4系（如果api允许）
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_message},
            ],
            temperature=0.5,
            max_tokens=1000,
            top_p=0.95,
            stream=False,
            stop=None,
            presence_penalty=0
        )
    except Exception as e:
        return Response(json.dumps({'error': str(e)}, ensure_ascii=False), mimetype='application/json', status=500)

    return Response(json.dumps({'message': api_response.choices[0].message.content}, ensure_ascii=False), mimetype='application/json')

@app.route('/dalle', methods=['POST'])
def create_image():
    data = request.get_json()
    prompt = data.get('prompt', '')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400
    
    try:
        # 发送请求到 OpenAI DALL·E API
        response = client.images.generate(
            model="dall-e-2", # 默认dall-e-2，可选dall-e-3
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
            )
        
        # 从响应中获取图像数据
        image_url = response.data[0].url
        
        # 返回图像 URL 给前端
        return jsonify({'image': image_url})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True,port=5000)
import requests, os
with open('dummy.ogg', 'wb') as f: f.write(b'dummy data')
api_key=os.environ.get('GROQ_API_KEY')
try:
    res = requests.post(
        'https://api.groq.com/openai/v1/audio/transcriptions', 
        headers={'Authorization': f'Bearer {api_key}'}, 
        files={'file': ('dummy.ogg', open('dummy.ogg', 'rb'))}, 
        data={'model': 'whisper-large-v3'}
    )
    print(res.status_code, res.text)
except Exception as e:
    import traceback
    traceback.print_exc()

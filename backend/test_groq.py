import os
from groq import Groq
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
try:
    with open('dummy.ogg', 'wb') as f: f.write(b'dummy data')
    with open('dummy.ogg', 'rb') as f:
        print(client.audio.transcriptions.create(file=('dummy.ogg', f.read()), model='whisper-large-v3'))
except Exception as e:
    import traceback
    traceback.print_exc()

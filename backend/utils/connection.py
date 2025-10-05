from google import genai
import os

client = genai.Client(api_key="Api_key_here")


response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain how AI works in a few words"
)
print(response.text)

client.close()


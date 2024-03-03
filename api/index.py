from fastapi import FastAPI
import io_util
from llama_cpp import Llama
from data_model import Message, ChatInput, RAGResponse
from bruvi.index import chat_completion as bruvi_chat_completion


def messages_to_prompt(messages: list[Message]) -> str:
    """Creates a prompt from the message history.

    Example:
        You are a salesperson. You need to help the customer buy the product. The customer has name "C", and you
        have name "A". Below is the chat history.

        C: XXX
        A: XXX
        C: XXX
        A: 

    Args:
        messages: list of messages.
    """
    assert len(messages) > 0
    # Only keep up to the last 10 messages.
    messages = messages[-10:]
    prompt = (
        'You are a salesperson. You need to help the customer buy the '
        'product. The customer has name "C", and you have name "A". Below is the chat history.\n')
    for message in messages:
        source_str = 'C' if message.source == 'customer' else 'A'
        prompt += f'{source_str}: {message.text}\n'
    # Ask the assistant to respond.
    prompt += 'A: '
    return prompt


app = FastAPI()

@app.get('/api/hello')
def read_root():
    return {'hello': 'world'}


@app.post('/api/llama')
def llama_chat(data: ChatInput):
    model_path = io_util.download_model_if_not_exist(io_util.tiny_llama_1b)
    llm = Llama(model_path=model_path)
    output = llm(
        prompt=messages_to_prompt(data.messages),
        max_tokens=60,
    )
    return output

    
@app.post('/api/bruvi')
def bruvi_chat(data: ChatInput) -> RAGResponse:
    return bruvi_chat_completion(data)

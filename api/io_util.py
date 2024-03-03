import logging
import os
from dataclasses import dataclass
from tqdm import tqdm
import requests

# https://stackoverflow.com/a/23681578
logging.basicConfig(
    level=logging.INFO,
     format= '[%(levelname)s][%(asctime)s] %(pathname)s:%(lineno)d: %(message)s',
     datefmt='%H:%M:%S'
)

# https://stackoverflow.com/a/3430395
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = f'{BASE_DIR}/../models'


@dataclass
class ModelMetadata:
    name: str
    url: str


# https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v0.3-GGUF
tiny_llama_1b = ModelMetadata(
    name='TheBloke/TinyLlama-1.1B-Chat-v0.3-GGUF',
    url='https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v0.3-GGUF/resolve/main/tinyllama-1.1b-chat-v0.3.Q5_K_S.gguf'
)


# https://stackoverflow.com/a/16696317
def download_model_if_not_exist(model: ModelMetadata) -> str:
    basename = os.path.basename(model.url)
    destination_path = os.path.join(MODELS_DIR, basename)
    if os.path.exists(destination_path):
        logging.info(f'Model exists at: {destination_path}')
        return destination_path

    logging.info(f'Downloading model at: {destination_path}')
    with requests.get(model.url, stream=True) as response:
        response.raise_for_status()
        with open(destination_path, 'wb') as handle:
            for data in tqdm(response.iter_content(chunk_size=8192)):
                handle.write(data)
    return destination_path

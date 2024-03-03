from data_model import ChatInput, RAGResponse, ReferenceData
import pandas as pd
import numpy as np
import openai
from dotenv import load_dotenv
from functools import cache


# Load the OpenAI API key.
load_dotenv(override=True)


EMBED_MODEL_ID = 'text-embedding-ada-002'
CHAT_MODEL_ID = 'gpt-3.5-turbo'
INITIAL_MESSAGES = [
    {"role": "system", "content": "You are George, the salesperson of Bruvi, a coffee brewing brand. You will help the customer find the product to purchase. You will be kind, enthusiastic and patient. Every time the user asks a question, you will be given some context. Only answer the question based on the context. If the information is not in the context, just say you don't know."}
]

@cache
def get_openai_client():
    return openai.OpenAI()


@cache
def get_site_data():
    site_data_file = 'bruvi/site_data.pickle'
    site_data = pd.read_pickle(site_data_file)
    return site_data


def create_prompt(query, relevant_site_data, chat_history=[], summary_word_limit=300):
    def _truncate(text):
        return ' '.join(text.split(' ')[:summary_word_limit])

    context = '\n'.join([_truncate(text) for text in relevant_site_data.text_summary])
    # Only keep the messages provided by the user and the assistant.
    chat_history = [(role, content) for role, content in chat_history if role in ['user', 'assistant']]
    def _message_to_str(role: str, content: str):
        role_str = 'Q' if role == 'user' else 'A'
        return f'{role_str}: {content}'
    prev_message_str = '\n'.join([_message_to_str(role, content) for role, content in chat_history])
    prompt = f"""
Context:
{context}

----

{prev_message_str}
Q: {query}
A: """
    return prompt


def get_relevant_pages(query: str, site_data: pd.DataFrame, n: int=3):
  client = get_openai_client()
  embeddings = np.array(site_data.embedding.to_list())
  print(client.api_key)
  query_response = client.embeddings.create(
      model=EMBED_MODEL_ID,
      input=query,
      encoding_format='float'
  )
  # [emb_dim]
  query_embedding = np.array(query_response.data[0].embedding)
  # [num_pages]
  cos_similarities = embeddings.dot(query_embedding)
  # Sort from high to low.
  ranked_indices = np.argsort(cos_similarities)[::-1]
  top_n_indices = ranked_indices[:n]
  top_n_scores = cos_similarities[top_n_indices]
  top_n_site_data = site_data.loc[top_n_indices]
  top_n_site_data['query_similarity_score'] = top_n_scores
  return top_n_site_data


def _site_data_to_references(site_data: pd.DataFrame) -> list[ReferenceData]:
    sources = []
    for row in site_data.itertuples():
        sources.append(ReferenceData(url=row.url, page_title=row.page_title, text_summary=row.text_summary))
    return sources


def input_to_query_and_chat_history(data: ChatInput) -> tuple[str, list[tuple]]:
    assert len(data.messages) > 0
    
    def _to_role(source: str) -> str:
        # Role is a concept in OpenAI. It can be user or assistant.
        # Our definition is source is more broad, because we want to
        # support different models, or even human assistant.
        if source == 'customer':
            return 'user'
        else:
            return 'assistant'
    
    # [(role, text)]
    past_messages = data.messages[:-1]
    chat_history = [(_to_role(message.source), message.text) for message in past_messages]
    query = data.messages[-1].text
    return query, chat_history


def chat_completion(data: ChatInput) -> RAGResponse:
    site_data = get_site_data()
    client = get_openai_client()

    messages = INITIAL_MESSAGES
    query, chat_history = input_to_query_and_chat_history(data)
    relevant_site_data = get_relevant_pages(query, site_data)
    prompt = create_prompt(query, relevant_site_data, chat_history=chat_history)
    messages += [{"role": "user", "content": prompt}]
    completion = client.chat.completions.create(
        model=CHAT_MODEL_ID,
        messages=messages,
    )
    content = completion.choices[0].message.content
    references = _site_data_to_references(relevant_site_data)
    return RAGResponse(references=references, content=content)

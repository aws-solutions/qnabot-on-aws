import time
import torch
from torch import Tensor
from transformers import AutoTokenizer, AutoModel
import torch.nn.functional as F

def model_fn(model_dir):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    nlp_model = AutoModel.from_pretrained(model_dir,output_hidden_states=True)
    nlp_model.to(device)
    model = {'model':nlp_model, 'tokenizer':tokenizer}
    return model

def average_pool(last_hidden_states: Tensor,
                 attention_mask: Tensor) -> Tensor:
    last_hidden = last_hidden_states.masked_fill(~attention_mask[..., None].bool(), 0.0)
    return last_hidden.sum(dim=1) / attention_mask.sum(dim=1)[..., None]

def embed_tformer(model, tokenizer, sentences):
    encoded_input = tokenizer(sentences, padding=True, truncation=True, max_length=512, return_tensors='pt')
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    encoded_input.to(device)
    #Compute token embeddings
    with torch.no_grad():
        model_output = model(**encoded_input)
    embeddings = average_pool(model_output.last_hidden_state, encoded_input['attention_mask'])
    return embeddings

def predict_fn(data, model):
    start_time = time.time()
    sentences = data.pop("inputs", data)
    embeddings = embed_tformer(model['model'], model['tokenizer'], sentences)
    print("--- Inference time: %s seconds ---" % (time.time() - start_time))
    response = embeddings[0].tolist()
    print("--- Inference + Normalization time: %s seconds ---" % (time.time() - start_time))
    return {"vectors": response}
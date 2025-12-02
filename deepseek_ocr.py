"""
DeepSeek OCR on Modal.com
Serverless GPU-accelerated OCR using DeepSeek OCR model
"""

import modal
from pathlib import Path

# Create Modal app
app = modal.App("deepseek-ocr")

# Define container image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.12")
    # Install CUDA development tools for flash-attn compilation
    .apt_install(
        "git",  # Required for flash-attn build
        "wget",
        "build-essential"
    )
    # Install CUDA toolkit
    .run_commands(
        "wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb",
        "dpkg -i cuda-keyring_1.1-1_all.deb",
        "apt-get update",
        "apt-get -y install cuda-toolkit-12-4",
        "export CUDA_HOME=/usr/local/cuda-12.4",
        "export PATH=$CUDA_HOME/bin:$PATH",
        "export LD_LIBRARY_PATH=$CUDA_HOME/lib64:$LD_LIBRARY_PATH"
    )
    .pip_install("ninja", "packaging")  # Build dependencies
    .pip_install(
        "torch==2.6.0",
        "transformers==4.46.3",
        "tokenizers==0.20.3",
        "einops",
        "addict",
        "easydict",
        "Pillow",
        "requests",
        "fastapi",
    )
    # Install flash-attention with CUDA environment properly set
    .run_commands(
        "export CUDA_HOME=/usr/local/cuda-12.4",
        "export PATH=$CUDA_HOME/bin:$PATH",
        "export LD_LIBRARY_PATH=$CUDA_HOME/lib64:$LD_LIBRARY_PATH",
        "MAX_JOBS=4 pip install flash-attn==2.7.3 --no-build-isolation"
    )
)

# Create a volume to cache the model
model_volume = modal.Volume.from_name("deepseek-ocr-models", create_if_missing=True)
MODEL_DIR = "/models"

# Download model during image build to speed up cold starts
@app.function(
    image=image,
    volumes={MODEL_DIR: model_volume},
    timeout=3600,  # Model download can take time
)
def download_model():
    """Download and cache the DeepSeek OCR model"""
    from transformers import AutoModel, AutoTokenizer
    
    model_name = "deepseek-ai/DeepSeek-OCR"
    cache_dir = f"{MODEL_DIR}/deepseek-ocr"
    
    print(f"Downloading model to {cache_dir}...")
    tokenizer = AutoTokenizer.from_pretrained(
        model_name, 
        trust_remote_code=True,
        cache_dir=cache_dir
    )
    model = AutoModel.from_pretrained(
        model_name,
        _attn_implementation="flash_attention_2",
        trust_remote_code=True,
        use_safetensors=True,
        cache_dir=cache_dir
    )
    print("Model downloaded and cached successfully!")
    model_volume.commit()


@app.function(
    image=image,
    gpu="A100",  # Using A100 as confirmed by user
    volumes={MODEL_DIR: model_volume},
    timeout=600,
    scaledown_window=120,  # Keep container warm for 2 minutes
)
def process_ocr(
    image_url: str = None,
    image_base64: str = None,
    prompt: str = "<image>\n<|grounding|>Convert the document to markdown. ",
    mode: str = "base",  # Using "base" as default per user request
    save_results: bool = False,
    test_compress: bool = False,
) -> dict:
    """
    Process OCR on an image using DeepSeek OCR model
    
    Args:
        image_url: URL to the image (optional if image_base64 provided)
        image_base64: Base64 encoded image (optional if image_url provided)
        prompt: OCR prompt (default: grounded markdown conversion)
        mode: OCR mode - "tiny", "small", "base", "large", or "gundam"
        save_results: Whether to save results to file
        test_compress: Whether to test compression
        
    Returns:
        dict with 'text' (OCR result) and optional 'metrics'
    """
    import torch
    import os
    import requests
    import base64
    from io import BytesIO
    from PIL import Image
    from transformers import AutoModel, AutoTokenizer
    
    # Set CUDA device
    os.environ["CUDA_VISIBLE_DEVICES"] = "0"
    
    # Load model and tokenizer from cache
    model_name = "deepseek-ai/DeepSeek-OCR"
    cache_dir = f"{MODEL_DIR}/deepseek-ocr"
    
    print("Loading model and tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        model_name, 
        trust_remote_code=True,
        cache_dir=cache_dir
    )
    model = AutoModel.from_pretrained(
        model_name,
        _attn_implementation="flash_attention_2",
        trust_remote_code=True,
        use_safetensors=True,
        cache_dir=cache_dir
    )
    model = model.eval().cuda().to(torch.bfloat16)
    print("Model loaded successfully!")
    
    # Download or decode image
    if image_url:
        print(f"Downloading image from {image_url}...")
        response = requests.get(image_url)
        image = Image.open(BytesIO(response.content))
    elif image_base64:
        print("Decoding base64 image...")
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
    else:
        raise ValueError("Either image_url or image_base64 must be provided")
    
    # Save image temporarily
    temp_image_path = "/tmp/input_image.jpg"
    image.save(temp_image_path)
    
    # Configure mode parameters
    mode_configs = {
        "tiny": {"base_size": 512, "image_size": 512, "crop_mode": False},
        "small": {"base_size": 640, "image_size": 640, "crop_mode": False},
        "base": {"base_size": 1024, "image_size": 1024, "crop_mode": False},
        "large": {"base_size": 1280, "image_size": 1280, "crop_mode": False},
        "gundam": {"base_size": 1024, "image_size": 640, "crop_mode": True},
    }
    
    config = mode_configs.get(mode.lower(), mode_configs["base"])
    
    print(f"Processing OCR with mode={mode}, config={config}...")
    
    # Run OCR
    result = model.infer(
        tokenizer,
        prompt=prompt,
        image_file=temp_image_path,
        output_path="/tmp",
        base_size=config["base_size"],
        image_size=config["image_size"],
        crop_mode=config["crop_mode"],
        save_results=save_results,
        test_compress=test_compress,
    )
    
    print("OCR processing complete!")
    
    return {
        "text": result,
        "mode": mode,
        "config": config,
    }


@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def ocr_endpoint(item: dict):
    """
    Web endpoint for OCR requests
    
    POST with JSON body:
    {
        "image_url": "https://example.com/image.jpg",  // or use image_base64
        "image_base64": "base64_encoded_image_data",
        "prompt": "<image>\n<|grounding|>Convert the document to markdown. ",  // optional
        "mode": "base",  // optional: tiny, small, base, large, gundam
        "test_compress": false  // optional
    }
    """
    return process_ocr.remote(
        image_url=item.get("image_url"),
        image_base64=item.get("image_base64"),
        prompt=item.get("prompt", "<image>\n<|grounding|>Convert the document to markdown. "),
        mode=item.get("mode", "base"),
        save_results=item.get("save_results", False),
        test_compress=item.get("test_compress", False),
    )


# Test functions
@app.local_entrypoint()
def test_url():
    """Test with a sample image URL"""
    # Example menu image URL (you can replace with your own)
    test_image_url = "https://images.unsplash.com/photo-1504674900247-0877df9cc836"
    
    print(f"Testing OCR with image URL: {test_image_url}")
    result = process_ocr.remote(
        image_url=test_image_url,
        mode="base",
    )
    print("\n=== OCR Result ===")
    print(result["text"])
    print(f"\nMode: {result['mode']}")
    print(f"Config: {result['config']}")


@app.local_entrypoint()
def test_local(image_path: str = None):
    """Test with a local image file"""
    import base64
    
    if not image_path:
        print("Please provide an image path: modal run deepseek_ocr.py::test_local --image-path /path/to/image.jpg")
        return
    
    # Read and encode image
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")
    
    print(f"Testing OCR with local image: {image_path}")
    result = process_ocr.remote(
        image_base64=image_data,
        mode="base",
    )
    print("\n=== OCR Result ===")
    print(result["text"])
    print(f"\nMode: {result['mode']}")
    print(f"Config: {result['config']}")

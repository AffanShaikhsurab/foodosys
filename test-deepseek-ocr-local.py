"""
Local Test of DeepSeek-OCR Model
Testing with transformers before deploying to Modal
"""

from transformers import AutoModel, AutoTokenizer
import torch
import os
from PIL import Image
import time

# Set CUDA device
os.environ["CUDA_VISIBLE_DEVICES"] = '0'

def test_deepseek_ocr_local():
    """Test DeepSeek-OCR locally with transformers"""
    
    print("=" * 80)
    print("DeepSeek-OCR Local Test")
    print("=" * 80)
    print()
    
    # Test images
    test_images = [
        r"C:\Users\affan\Downloads\36bcd1c5-42b3-4aea-9fc2-4b051e98ab50.jpeg",
        r"C:\Users\affan\Downloads\Menu_of_Fatto_a_Mano_Pizzeria,_North_Laine_(desserts).jpg"
    ]
    
    # Check if images exist
    available_images = []
    for img_path in test_images:
        if os.path.exists(img_path):
            available_images.append(img_path)
            print(f"✓ Found: {os.path.basename(img_path)}")
        else:
            print(f"✗ Not found: {img_path}")
    
    if not available_images:
        print("\n❌ No test images found!")
        return
    
    print(f"\n📊 Will test with {len(available_images)} image(s)")
    print()
    
    # Load model
    model_name = 'deepseek-ai/DeepSeek-OCR'
    
    print("📥 Loading DeepSeek-OCR model...")
    print(f"   Model: {model_name}")
    
    try:
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            trust_remote_code=True
        )
        print("   ✓ Tokenizer loaded")
        
        model = AutoModel.from_pretrained(
            model_name,
            _attn_implementation='flash_attention_2',
            trust_remote_code=True,
            use_safetensors=True
        )
        print("   ✓ Model loaded")
        
        model = model.eval().cuda().to(torch.bfloat16)
        print("   ✓ Model moved to GPU (bfloat16)")
        print()
        
    except Exception as e:
        print(f"\n❌ Error loading model: {e}")
        print("\nTrying without flash attention...")
        try:
            model = AutoModel.from_pretrained(
                model_name,
                trust_remote_code=True,
                use_safetensors=True
            )
            model = model.eval().cuda().to(torch.bfloat16)
            print("   ✓ Model loaded (without flash attention)")
            print()
        except Exception as e2:
            print(f"❌ Failed again: {e2}")
            return
    
    # Test configurations
    test_configs = [
        {
            "name": "Gundam Mode (Recommended)",
            "base_size": 1024,
            "image_size": 640,
            "crop_mode": True
        },
        {
            "name": "Base Mode",
            "base_size": 1024,
            "image_size": 1024,
            "crop_mode": False
        }
    ]
    
    # Test each image with each config
    for img_idx, image_path in enumerate(available_images, 1):
        print(f"\n{'=' * 80}")
        print(f"Testing Image {img_idx}/{len(available_images)}: {os.path.basename(image_path)}")
        print(f"{'=' * 80}")
        
        # Get image info
        try:
            img = Image.open(image_path)
            print(f"Image size: {img.size[0]}x{img.size[1]} pixels")
            print(f"Image mode: {img.mode}")
            print()
        except Exception as e:
            print(f"❌ Error opening image: {e}")
            continue
        
        for config_idx, config in enumerate(test_configs, 1):
            print(f"\n🔬 Test {config_idx}: {config['name']}")
            print(f"   base_size={config['base_size']}, image_size={config['image_size']}, crop_mode={config['crop_mode']}")
            
            prompt = "<image>\n<|grounding|>Convert the document to markdown. "
            output_path = f"tests/output_{img_idx}_{config_idx}"
            os.makedirs(output_path, exist_ok=True)
            
            try:
                start_time = time.time()
                
                # Run OCR
                result = model.infer(
                    tokenizer,
                    prompt=prompt,
                    image_file=image_path,
                    output_path=output_path,
                    base_size=config['base_size'],
                    image_size=config['image_size'],
                    crop_mode=config['crop_mode'],
                    save_results=True,
                    test_compress=False
                )
                
                elapsed = time.time() - start_time
                
                print(f"   ✓ OCR completed in {elapsed:.2f}s")
                print(f"   Text length: {len(result)} characters")
                print()
                print("   📄 Result preview:")
                print("   " + "-" * 76)
                # Print first 300 characters
                preview = result[:300] if len(result) > 300 else result
                for line in preview.split('\n'):
                    print(f"   {line}")
                if len(result) > 300:
                    print("   ... (truncated)")
                print("   " + "-" * 76)
                print()
                
                # Save full result
                result_file = os.path.join(output_path, "result.md")
                with open(result_file, 'w', encoding='utf-8') as f:
                    f.write(f"# OCR Result - {os.path.basename(image_path)}\n\n")
                    f.write(f"**Config**: {config['name']}\n")
                    f.write(f"**Processing time**: {elapsed:.2f}s\n\n")
                    f.write("---\n\n")
                    f.write(result)
                
                print(f"   💾 Full result saved to: {result_file}")
                
            except Exception as e:
                print(f"   ❌ Error during OCR: {e}")
                import traceback
                traceback.print_exc()
                continue
    
    print(f"\n{'=' * 80}")
    print("✅ Local testing completed!")
    print(f"{'=' * 80}")

if __name__ == "__main__":
    test_deepseek_ocr_local()

import requests
import json

# 1. Khai báo API Key và endpoint
api_key = "AIzaSyDn5Ahrsf1DvnbvqWlHN_qMtcjCljG3kvc"
model = "gemini-2.5-flash" # Dùng bản flash cho rẻ và nhanh khi test
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

# 2. Cấu hình headers và payload (dữ liệu gửi đi)
headers = {
    "Content-Type": "application/json"
}

payload = {
    "contents": [{
        "parts": [{
            "text": "Xin chào, hãy trả lời ngắn gọn: bạn là ai và được tạo ra bởi ai? Đây là tin nhắn test API."
        }]
    }]
}

# 3. Thực hiện gọi API
try:
    print("Đang gửi request tới Gemini API...")
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    
    # Kiểm tra mã trạng thái HTTP
    if response.status_code == 200:
        print("\nThành công! API Key hoạt động tốt.\n")
        
        # Parse kết quả JSON trả về
        result = response.json()
        
        # Lấy text từ cấu trúc JSON response của Gemini
        text_response = result['candidates'][0]['content']['parts'][0]['text']
        print("Phản hồi từ Gemini:")
        print("-" * 40)
        print(text_response.strip())
        print("-" * 40)
        
    else:
        print(f"\nLỗi gọi API: {response.status_code}")
        print("Chi tiết lỗi:", response.json())

except Exception as e:
    print(f"\nCó lỗi xảy ra trong quá trình thực thi: {e}")
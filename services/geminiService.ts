import { GoogleGenAI } from "@google/genai";
import { GENERATION_SYSTEM_INSTRUCTION } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type GenerationMode = 'original' | 'similar' | 'advanced';

export const generateMathProblem = async (
  base64Data: string,
  mimeType: string,
  mode: GenerationMode,
  count: number = 1,
  customPrompt: string = ""
): Promise<string> => {
  try {
    let prompt = "";
    
    // Common instruction for formatting
    const formatInstruction = "Trình bày rõ ràng, sử dụng LaTeX cho công thức toán ($...$). Tuân thủ cấu trúc 3 phần: Phân tích -> Lời giải -> Bình luận.";

    const quantityInstruction = count > 1 
      ? `YÊU CẦU: Tạo ra đúng ${count} bài toán riêng biệt. Đánh số rõ ràng (Bài 1, Bài 2...). Với MỖI bài toán, phải thực hiện đầy đủ quy trình giải và bình luận.` 
      : "YÊU CẦU: Tạo ra 1 bài toán hoàn chỉnh kèm lời giải chi tiết và bình luận.";

    switch (mode) {
      case 'original':
        prompt = `NHIỆM VỤ: Giải bài tập gốc trong hình ảnh.
        1. Hãy đọc kỹ đề bài trong hình và chép lại đề bài bằng văn bản (nếu hình mờ hãy cố gắng luận giải).
        2. Phân tích hướng giải (dạng toán nào, dùng định lý nào).
        3. Giải chi tiết từng bước (Step-by-step) sử dụng kiến thức Toán THCS.
        4. Đưa ra nhận xét sư phạm cuối bài.
        ${formatInstruction}`;
        break;

      case 'advanced':
        prompt = `NHIỆM VỤ: Sáng tạo bài tập nâng cao từ bài gốc.
        1. Phân tích bài toán gốc trong hình để hiểu cấu trúc và dạng bài.
        2. ${quantityInstruction}
        3. Các bài toán mới này phải CÙNG DẠNG với bài gốc nhưng MỞ RỘNG/NÂNG CAO HƠN (tăng độ khó, yêu cầu tư duy sâu hơn).
        4. Giải chi tiết từng bài.
        5. QUAN TRỌNG: Trong phần bình luận, BẮT BUỘC phải so sánh: Bài mới này khó hơn bài gốc ở điểm nào? (Thêm biến, thêm điều kiện, hay cần kỹ thuật giải phức tạp hơn?).
        LƯU Ý: Vẫn chỉ được dùng kiến thức THCS để giải (không dùng kiến thức cấp 3).
        ${formatInstruction}`;
        break;

      case 'similar':
      default:
        prompt = `NHIỆM VỤ: Sáng tạo bài tập tương tự để luyện tập.
        1. Phân tích bài toán gốc trong hình.
        2. ${quantityInstruction}
        3. Các bài toán này chỉ thay đổi số liệu hoặc ngữ cảnh, GIỮ NGUYÊN cấu trúc và độ khó so với bài gốc.
        4. Giải chi tiết từng bài.
        5. QUAN TRỌNG: Trong phần bình luận, BẮT BUỘC phải so sánh: Bài mới này khác bài gốc ở đâu? (Ví dụ: "Thay đổi hệ số a từ 2 thành 3", "Đổi dấu từ cộng sang trừ"...).
        ${formatInstruction}`;
        break;
    }

    // Append user custom prompt if exists
    if (customPrompt && customPrompt.trim() !== "") {
      prompt += `\n\n----------------\nLƯU Ý QUAN TRỌNG TỪ NGƯỜI DÙNG (Hãy ưu tiên thực hiện yêu cầu này): "${customPrompt}"\n----------------`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        systemInstruction: GENERATION_SYSTEM_INSTRUCTION,
        temperature: 0.4, // Keep strictly creative but consistent
      },
    });

    return response.text || "Xin lỗi, tôi không thể xử lý yêu cầu này lúc này. Vui lòng thử lại.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Đã xảy ra lỗi khi kết nối với AI. Vui lòng kiểm tra API Key hoặc thử lại sau.");
  }
};
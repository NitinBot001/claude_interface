// src/lib/puter.js
/**
 * Puter.js AI SDK Wrapper
 * Handles multimodal chat with proper streaming JSON parsing
 */

function getPuter() {
  if (typeof window !== 'undefined' && window.puter) {
    return window.puter;
  }
  throw new Error('Puter.js SDK not loaded');
}

/**
 * Parse a chunk that might be JSON or plain text
 */
function parseChunk(chunk) {
  // Null/undefined
  if (chunk === null || chunk === undefined) {
    return '';
  }

  // Already a string
  if (typeof chunk === 'string') {
    const trimmed = chunk.trim();
    
    // Try to parse as JSON
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        
        // Handle {"type":"text","text":"..."} format
        if (parsed.type === 'text' && typeof parsed.text === 'string') {
          return parsed.text;
        }
        
        // Handle {"type":"usage",...} - ignore
        if (parsed.type === 'usage') {
          return '';
        }
        
        // Handle other formats
        if (parsed.text) return parsed.text;
        if (parsed.content) return parsed.content;
        if (parsed.message?.content) return parsed.message.content;
        if (parsed.delta?.content) return parsed.delta.content;
        
        return '';
      } catch {
        // Not valid JSON, return as-is
        return chunk;
      }
    }
    
    return chunk;
  }

  // Object - extract text
  if (typeof chunk === 'object') {
    // {"type":"text","text":"..."} format
    if (chunk.type === 'text' && typeof chunk.text === 'string') {
      return chunk.text;
    }
    
    // {"type":"usage",...} - ignore
    if (chunk.type === 'usage') {
      return '';
    }
    
    // Standard formats
    if (chunk.text) return chunk.text;
    if (chunk.content) return chunk.content;
    if (chunk.message?.content) {
      const content = chunk.message.content;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('');
      }
    }
    if (chunk.delta?.content) return chunk.delta.content;
    if (chunk.choices?.[0]?.delta?.content) return chunk.choices[0].delta.content;
    
    return '';
  }

  return String(chunk);
}

/**
 * Parse final response
 */
function parseResponse(response) {
  if (!response) return '';
  
  if (typeof response === 'string') {
    return parseChunk(response);
  }
  
  if (typeof response === 'object') {
    // Array of content blocks
    if (Array.isArray(response)) {
      return response.map(parseChunk).join('');
    }
    
    return parseChunk(response);
  }
  
  return '';
}

/**
 * Convert File to Base64
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      reject(new Error('Image must be less than 20MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Non-streaming chat
 */
export async function sendChatMessage(prompt, imageBase64 = null, options = {}) {
  const puter = getPuter();
  const { model = 'claude-sonnet-4-5-20250929' } = options;

  try {
    let response;

    if (imageBase64) {
      response = await puter.ai.chat(prompt, imageBase64, { model });
    } else {
      response = await puter.ai.chat(prompt, { model });
    }

    return parseResponse(response);
  } catch (error) {
    console.error('Puter AI Error:', error);
    throw new Error(error.message || 'Failed to get AI response');
  }
}

/**
 * Streaming chat
 */
export async function sendChatMessageStream(prompt, imageBase64 = null, options = {}) {
  const puter = getPuter();
  
  const { 
    model = 'claude-sonnet-4-5-20250929', 
    onChunk,
    onStart,
    onEnd,
    onError
  } = options;

  try {
    if (onStart) onStart();

    const streamOptions = { model, stream: true };
    let response;

    if (imageBase64) {
      response = await puter.ai.chat(prompt, imageBase64, streamOptions);
    } else {
      response = await puter.ai.chat(prompt, streamOptions);
    }

    // Handle async iterator (streaming)
    if (response && typeof response[Symbol.asyncIterator] === 'function') {
      let fullText = '';
      
      for await (const chunk of response) {
        const chunkText = parseChunk(chunk);
        
        if (chunkText) {
          fullText += chunkText;
          if (onChunk) {
            onChunk(chunkText, fullText);
          }
        }
      }
      
      if (onEnd) onEnd(fullText);
      return fullText;
    }

    // Not streaming - parse as regular response
    const text = parseResponse(response);
    if (onChunk) onChunk(text, text);
    if (onEnd) onEnd(text);
    return text;

  } catch (error) {
    console.error('Puter AI Stream Error:', error);
    if (onError) onError(error);
    throw new Error(error.message || 'Failed to get AI response');
  }
}

/**
 * Compress image
 */
export function compressImage(base64, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}

export default {
  fileToBase64,
  sendChatMessage,
  sendChatMessageStream,
  compressImage
};
import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { AIService } from '../../../../services/ai.service';
import '../../../../styles/ai-assistant.css';

interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

// Simple markdown to HTML converter for AI responses
function renderMarkdown(text: string): string {
    let html = text
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Code blocks
        .replace(/```[\s\S]*?```/g, (match) => {
            const code = match.replace(/```\w*\n?/g, '').replace(/```/g, '');
            return `<pre><code>${code}</code></pre>`;
        })
        // Unordered lists
        .replace(/^[\s]*[-*] (.*$)/gm, '<li>$1</li>')
        // Ordered lists
        .replace(/^[\s]*\d+\. (.*$)/gm, '<li>$1</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');

    // Wrap consecutive <li> tags in <ul>
    html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

    return `<p>${html}</p>`;
}

const DEFAULT_SUGGESTIONS = [
    "How am I spending this month?",
    "Am I on track with my budgets?",
    "Where can I cut expenses?",
    "Give me a savings plan",
    "Summarize my finances",
    "What are my biggest expenses?"
];

function AIAssistant() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { sendMessage, getSuggestions } = AIService();

    // Load suggestions on mount
    useEffect(() => {
        getSuggestions().then(s => {
            if (s.length > 0) setSuggestions(s);
        });
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Auto-resize textarea
    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    };

    const handleSend = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        // Add user message
        const userMessage: ChatMessage = { role: 'user', parts: text };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        // Call AI service
        setIsLoading(true);
        try {
            const response = await sendMessage(text, messages);
            if (response) {
                const aiMessage: ChatMessage = { role: 'model', parts: response.response };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                const errorMessage: ChatMessage = {
                    role: 'model',
                    parts: "I'm sorry, I couldn't process your request right now. Please try again in a moment. 🔄"
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch {
            const errorMessage: ChatMessage = {
                role: 'model',
                parts: "Something went wrong. Please check your connection and try again. ⚠️"
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="ai-assistant">
            {/* Header */}
            <div className="ai-header">
                <div className="ai-header-avatar">✨</div>
                <div className="ai-header-info">
                    <h2>Smart Wallet AI</h2>
                    <p>
                        <span className="ai-status-dot"></span>
                        Your personal financial advisor
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="ai-messages">
                {messages.length === 0 ? (
                    <div className="ai-welcome">
                        <div className="ai-welcome-icon">💰</div>
                        <h3>Hi! I'm your AI Financial Advisor</h3>
                        <p>
                            I can analyze your spending, budgets, and accounts to give you
                            personalized financial advice. Ask me anything about your finances!
                        </p>
                        <div className="ai-suggestions">
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    className="ai-suggestion-chip"
                                    onClick={() => handleSend(suggestion)}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, i) => (
                            <div key={i} className={`ai-message ai-message--${msg.role}`}>
                                <div className="ai-message-avatar">
                                    {msg.role === 'user' ? '👤' : '✨'}
                                </div>
                                <div
                                    className="ai-message-content"
                                    dangerouslySetInnerHTML={
                                        msg.role === 'model'
                                            ? { __html: renderMarkdown(msg.parts) }
                                            : undefined
                                    }
                                >
                                    {msg.role === 'user' ? msg.parts : undefined}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="ai-typing">
                                <div className="ai-message-avatar" style={{
                                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                                }}>
                                    ✨
                                </div>
                                <div className="ai-typing-dots">
                                    <div className="ai-typing-dot"></div>
                                    <div className="ai-typing-dot"></div>
                                    <div className="ai-typing-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="ai-input-area">
                <div className="ai-input-wrapper">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your finances..."
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        className="ai-send-btn"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        title="Send message"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AIAssistant;

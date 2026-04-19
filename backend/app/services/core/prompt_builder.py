"""Prompt builder for different chat modes with enhanced prompts."""


class PromptBuilder:
    """Build system prompts based on chat modes and context."""
    
    # Enhanced system prompts for different modes
    TEACHING_MODE_SYSTEM = """You are an Expert AI Tutor in a comprehensive learning platform.

YOUR CORE RESPONSIBILITIES:
1. Provide detailed, well-structured explanations with conceptual clarity
2. Break complex topics into digestible, sequential steps
3. Use real-world examples and analogies to enhance understanding
4. Encourage active learning and critical thinking
5. Adapt explanations to the student's comprehension level
6. Use formatting (headers, lists, code blocks) for clarity

TEACHING APPROACH:
- Start with the "why" before the "how"
- Use analogies when explaining abstract concepts
- Provide worked examples with clear step-by-step solutions
- Highlight common misconceptions and clarify them
- End with a summary and reinforce key concepts
- Be patient, supportive, and encouraging throughout

RESPONSE STYLE:
- Clear, structured, and educational
- Include visual separators and formatting for readability
- Provide multiple examples when appropriate
- Always encourage questions and deeper exploration"""

    GUIDING_MODE_SYSTEM = """You are a Socratic Tutor using guided discovery learning.

YOUR CORE METHODOLOGY:
1. Ask thought-provoking questions to guide discovery
2. Help students uncover answers through reasoning
3. Provide strategic hints instead of direct answers
4. Encourage metacognition (thinking about thinking)
5. Develop critical thinking and problem-solving skills
6. Lead students to their own insights and understanding

TEACHING APPROACH:
- Never provide direct answers to questions
- Ask clarifying questions to understand student's current understanding
- Use scaffolding: break complex problems into smaller guiding questions
- Validate student thinking and encourage deeper exploration
- When stuck, provide targeted hints focused on key concepts
- Guide students to check their own reasoning
- Celebrate the "aha!" moments of discovery

RESPONSE STYLE:
- Conversational and encouraging tone
- Questions that promote reflection and deeper thinking
- Patient with the discovery process
- Acknowledge partial understanding and build on it"""

    NORMAL_MODE_SYSTEM = """You are a Helpful Learning Assistant in an educational platform.

YOUR PRIMARY FUNCTIONS:
1. Answer questions clearly, accurately, and concisely
2. Provide relevant, contextual information
3. Assist with learning-related queries and academic support
4. Maintain a friendly, professional, and supportive tone
5. Guide students toward resources when appropriate
6. Balance brevity with comprehensiveness

COMMUNICATION APPROACH:
- Answer directly but not oversimplifying
- Provide context when helpful
- Use examples to illustrate points
- Be conversational and approachable
- Show understanding of what students need
- Suggest follow-up questions when relevant

RESPONSE STYLE:
- Clear and direct
- Well-organized for easy reading
- Friendly and encouraging
- Professional yet conversational"""

    QUIZ_MODE_SYSTEM = """You are an Intelligent Quiz Assistant guiding students through assessment.

STRICT RULES - ALWAYS ENFORCE:
🚫 NEVER provide direct answers to quiz questions
🚫 NEVER reveal the correct answer, even if directly asked
🚫 NEVER give away the solution step-by-step

YOUR SUPPORT ROLE:
1. Ask clarifying questions about what the student understands
2. Help identify knowledge gaps without revealing answers
3. Guide thinking process and problem-solving approach
4. Provide hints that focus on relevant concepts
5. Encourage students to verify their own reasoning
6. Suggest reviewing specific material if needed

HINTS STRATEGY:
- Ask "What concept does this relate to?"
- Guide with questions: "Have you considered...?"
- Suggest reviewing relevant material
- Help break down the problem into parts
- Point to important details student may have missed

FEEDBACK APPROACH:
- Acknowledge effort and reasoning shown
- Point out what's right in their approach if applicable
- Guide toward correct thinking without revealing answer
- Encourage attempting again with new perspective"""

    def __init__(self):
        self.mode_systems = {
            "teaching": self.TEACHING_MODE_SYSTEM,
            "guiding": self.GUIDING_MODE_SYSTEM,
            "normal": self.NORMAL_MODE_SYSTEM,
            "quiz": self.QUIZ_MODE_SYSTEM
        }
    
    def build_system_prompt(self, mode: str = "normal", lesson_context: str = None, quiz_context: str = None, feedback_context: str = None) -> str:
        """Build system prompt based on mode and additional context."""
        mode_key = mode.lower() if mode else "normal"
        system_prompt = self.mode_systems.get(mode_key, self.NORMAL_MODE_SYSTEM)
        
        # Add lesson context if provided
        if lesson_context:
            system_prompt += f"\n\n📚 LESSON CONTEXT:\n{lesson_context}"
        
        # Add quiz context if provided
        if quiz_context:
            system_prompt += f"\n\n📝 QUIZ CONTEXT:\n{quiz_context}"
        
        # Add feedback context to adapt based on what student liked/disliked
        if feedback_context:
            system_prompt += f"\n\n💡 STUDENT FEEDBACK HISTORY:\n{feedback_context}"
        
        return system_prompt
    
    def build_regeneration_prompt(self, mode: str = "normal", feedback_reason: str = None, improvement_suggestions: list = None) -> str:
        """Build system prompt for regenerating responses based on user feedback."""
        mode_key = mode.lower() if mode else "normal"
        system_prompt = self.mode_systems.get(mode_key, self.NORMAL_MODE_SYSTEM)
        
        # Add feedback context for regeneration
        regeneration_context = "\n\n♻️ REGENERATION FEEDBACK:\nThe user requested a new response."
        
        if feedback_reason:
            regeneration_context += f"\nReason: {feedback_reason}"
        
        if improvement_suggestions:
            regeneration_context += f"\nImprovement areas: {', '.join(improvement_suggestions)}"
        
        regeneration_context += "\n\nPlease provide an improved response that addresses the feedback."
        regeneration_context += "\nVary your approach, examples, and explanations to offer a fresh perspective."
        
        system_prompt += regeneration_context
        
        return system_prompt
    
    def build_conversation_messages(self, system_prompt: str, context_messages: list, user_message: str) -> list:
        """Build the complete messages list for OpenAI API."""
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add context messages (conversation history)
        for msg in context_messages:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        return messages
    
    def build_rag_prompt(self, mode: str, user_message: str, retrieved_context: str = None) -> str:
        """Build prompt with RAG (Retrieval-Augmented Generation) context injection."""
        if retrieved_context:
            rag_instruction = f"""Reference Material:
{retrieved_context}

---

User Query:"""
            return rag_instruction + f"\n{user_message}"
        
        return user_message
    
    def build_summary_prompt(self, content: str, summary_type: str = "short") -> str:
        """Build prompt for content summarization."""
        if summary_type == "bullet_points":
            return f"""Summarize the following content as concise bullet points. 
Organize by main topics. Keep each point under 15 words.

Content:
{content}

Bullet point summary:"""
        elif summary_type == "detailed":
            return f"""Create a detailed summary of the following content.
Include all important concepts, examples, and explanations.

Content:
{content}

Detailed summary:"""
        else:  # short
            return f"""Create a brief, concise summary of the following content in 2-3 sentences.

Content:
{content}

Summary:"""


# Global prompt builder instance
prompt_builder = PromptBuilder()

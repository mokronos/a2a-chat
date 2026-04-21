from dotenv import load_dotenv

load_dotenv()
import os
from pydantic_ai import Agent, FunctionToolset
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.mcp import MCPServerStreamableHTTP

# executor = MCPServerStreamableHTTP("http://localhost:4788/mcp")

def get_weather(location: str) -> str:
    """Get the weather in a given location."""
    return f"The weather in {location} is sunny with a temperature of 25 degrees Celsius."

toolset = FunctionToolset([get_weather])

model = OpenAIChatModel(
    'big-pickle',
    provider=OpenAIProvider(
        base_url='https://opencode.ai/zen/v1', api_key=os.environ["OPENCODE_ZEN_API_KEY"]
    ),
)

agent = Agent(
    model,
    name="openrouter-free-agent",
    instructions="You are a concise, helpful assistant.",
    toolsets=[toolset],
)

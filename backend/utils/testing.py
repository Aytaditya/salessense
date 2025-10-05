from google import genai
from neo4j import GraphDatabase

# === Configure Gemini ===
client = genai.Client(api_key="Api_key")

# === Neo4j Config ===
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASS = "test1234"


def query_llm_for_cypher(user_question: str):
    """
    Send a natural language question to Gemini and get a Cypher query.
    """

    prompt = f"""
You are an expert Neo4j Cypher query generator.

The Neo4j database has the following schema:

(:Customer)-[:LIVES_IN]->(:Country)
(:Customer)-[:MADE]->(:Transaction)-[:PURCHASED]->(:Product)

Node properties:
- Customer: id
- Country: name
- Transaction: id, date, quantity, total_amount
- Product: id, name, price

Relationships:
- (Customer)-[:LIVES_IN]->(Country)
- (Customer)-[:MADE]->(Transaction)
- (Transaction)-[:PURCHASED]->(Product)

Given a natural language question, generate a valid Cypher query that can be executed on this graph.

Make sure:
- Relationship names exactly match: LIVES_IN, MADE, PURCHASED
- Use property names correctly: id, name, date, quantity, total_amount, price
- Use proper aggregation (SUM, COUNT, etc.)
- Always return user-friendly column names with aliases (AS)
- Only output the Cypher query, no explanations or markdown

Example format:
MATCH (c:Customer)-[:LIVES_IN]->(co:Country)
MATCH (c)-[:MADE]->(t:Transaction)
RETURN co.name AS Country, SUM(t.total_amount) AS TotalSales
ORDER BY TotalSales DESC

User Question: Top 5 products by revenue in each country.
Generated Cypher Query:
MATCH (c:Customer)-[:LIVES_IN]->(co:Country)
MATCH (c)-[:MADE]->(t:Transaction)-[:PURCHASED]->(p:Product)
RETURN co.name AS Country, p.name AS Product, SUM(t.total_amount) AS Revenue
ORDER BY Country, Revenue DESC
LIMIT 5

User Question: {user_question}
"""

    # Generate the Cypher query from Gemini
    response = client.models.generate_content(
        model="gemini-2.5-flash",  
        contents=prompt
    )

    cypher_query = response.text.strip()
    return cypher_query


def execute_cypher_query(uri, user, password, query):
    driver = GraphDatabase.driver(uri, auth=(user, password))
    with driver.session() as session:
        result = session.run(query)
        data = [r.data() for r in result]
    driver.close()
    return data


if __name__ == "__main__":
    user_input = "Which customers increased their spending by more than 50% in the last 6 months compared to the previous 6 months?"
    cypher_query = query_llm_for_cypher(user_input)

    print("Generated Cypher Query:\n", cypher_query)

    try:
        data = execute_cypher_query(NEO4J_URI, NEO4J_USER, NEO4J_PASS, cypher_query)
        print("\nQuery Results:\n", data)
    except Exception as e:
        print("\nError executing Cypher query:", e)

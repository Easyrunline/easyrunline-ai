import {
  findBettingKnowledge,
  formatKnowledgeContext,
} from "@/lib/knowledge/knowledgeRouter";

interface KnowledgeTestRequest {
  question?: string;
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        KnowledgeTestRequest;

    const question =
      body.question?.trim();

    if (!question) {
      return Response.json(
        {
          error:
            "Please provide a question.",
        },
        {
          status: 400,
        }
      );
    }

    const matches =
      findBettingKnowledge(
        question
      );

    return Response.json({
      question,
      matches: matches.map(
        ({
          entry,
          score,
          matchedTerms,
        }) => ({
          id: entry.id,
          title: entry.title,
          category:
            entry.category,
          score,
          matchedTerms,
        })
      ),
      context:
        formatKnowledgeContext(
          matches
        ),
    });
  } catch (error) {
    console.error(
      "Knowledge test error:",
      error
    );

    return Response.json(
      {
        error:
          "Knowledge matching failed.",
      },
      {
        status: 500,
      }
    );
  }
}
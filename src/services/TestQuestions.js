// src/components/TestQuestions.jsx
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function TestQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("questions")
        .select(`
          id,
          question_text,
          choice_a,
          choice_b,
          choice_c,
          choice_d,
          correct_answers,
          difficulty
        `);

      if (error) {
        console.error("Supabase fetch error:", error);
        setError(error.message);
      } else {
        console.log("Fetched questions:", data);
        setQuestions(data ?? []);
      }

      setLoading(false);
    }

    fetchQuestions();
  }, []);

  if (loading) return <p>Loading questions...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (questions.length === 0) return <p>No questions found in database.</p>;

  return (
    <div>
      <h2>Test Questions from Supabase</h2>

      {questions.map((q) => (
        <div key={q.id} style={{ marginBottom: "20px" }}>
          <strong>{q.question_text}</strong>

          <ul>
            <li>A: {q.choice_a}</li>
            <li>B: {q.choice_b}</li>
            <li>C: {q.choice_c}</li>
            <li>D: {q.choice_d}</li>
          </ul>

          <p>
            <strong>Correct Answer:</strong> {q.correct_answers}
          </p>

          <p>
            <strong>Difficulty:</strong> {q.difficulty}
          </p>
        </div>
      ))}
    </div>
  );
}

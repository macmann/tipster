import RuleBuilder from '../components/RuleBuilder';

export default function RuleBuilderPage() {
  return (
    <div className="p-4">
      <nav className="mb-4">
        <a href="/" className="mr-2">Matches</a>
        |
        <a href="/recommendations" className="mx-2">Recommendations</a>
        |
        <a href="/rule-builder" className="ml-2">Rule Builder</a>
      </nav>
      <h1 className="text-center text-2xl font-semibold mb-4">Rule Builder</h1>
      <RuleBuilder userId="1" />
    </div>
  );
}

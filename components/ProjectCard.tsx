import Link from "next/link";
import { Project } from "@/types";
import RiskLabel from "@/components/RiskLabel";

export default function ProjectCard({ project }: { project: Project }) {
  const raised = project.currentAmount ?? 0;
  const goal = project.fundingGoal ?? 0;
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition"
    >
      <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-300 font-extrabold text-4xl">
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          project.title.substring(0, 2).toUpperCase()
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-bold text-gray-900">{project.title}</h3>
          {project.status === "ACTIVE" && <RiskLabel tag={project.riskTag} />}
        </div>

        <p className="text-sm text-gray-700 mb-4 line-clamp-2">{project.description}</p>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-700 mt-2">
          ${raised.toLocaleString()} de ${goal.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}
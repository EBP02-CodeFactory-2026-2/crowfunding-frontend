import Link from "next/link";
import { Project } from "@/types";

export default function ProjectCard({ project }: { project: Project }) {
  const progress = Math.min(
    (project.currentAmount / project.fundingGoal) * 100,
    100
  );

  return (
    <Link
      href={`/projects/${project.id}`}
      className="border rounded-lg overflow-hidden flex flex-col hover:shadow-lg transition"
    >
      <img
        src={project.imageUrl || "https://placehold.co/400x250?text=CrowdFunding"}
        alt={project.title}
        className="w-full h-48 object-cover"
      />

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h2 className="font-bold text-lg">{project.title}</h2>
        <p className="text-sm text-gray-500 line-clamp-2">
          {project.description}
        </p>

        <div className="mt-auto">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm mt-1">
            ${project.currentAmount.toLocaleString()} de $
            {project.fundingGoal.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
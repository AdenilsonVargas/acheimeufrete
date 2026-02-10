import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionUrl }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center mb-6 max-w-md">{description}</p>
      {actionLabel && actionUrl && (
        <Link to={actionUrl}>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}

import { useState } from "react";
import { Search } from "lucide-react";
import Input from "../common/Input";
import Button from "../common/Button";
import Table from "../common/Table";

const StudentSearch = ({ onSearch, results = [], loading = false }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search by name or school ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button type="submit" loading={loading}>
          <span className="inline-flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </span>
        </Button>
      </form>

      {results.length > 0 && (
        <Table
          rows={results}
          columns={[
            { key: "studentId", title: "ID" },
            { key: "studentSchoolId", title: "School ID" },
            { key: "fullName", title: "Name" },
            { key: "gender", title: "Gender" },
          ]}
          searchPlaceholder="Filter results..."
          pageSize={10}
        />
      )}
    </div>
  );
};

export default StudentSearch;

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import HelpResources from "@/components/help/HelpResources";
import HelpDocuments from "@/components/help/HelpDocuments";
import HelpContact from "@/components/help/HelpContact";
import HelpGettingStarted from "@/components/help/HelpGettingStarted";

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-foreground tracking-tight">Help & Support</h1>
        <p className="text-sm text-muted-foreground">Get help with LISTD and find answers to your questions</p>
      </div>

      {/* Search */}
      <div className="relative mb-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for help articles..."
          className="pl-10 h-12 rounded-xl"
        />
      </div>

      <div className="space-y-10">
        <HelpResources />
        <HelpDocuments />
        <HelpContact />
        <HelpGettingStarted />
      </div>
    </div>
  );
};

export default HelpPage;

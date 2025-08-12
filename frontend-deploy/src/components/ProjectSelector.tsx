import { useState } from 'react';
import { Check, ChevronsUpDown, FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/types';

interface ProjectSelectorProps {
  selectedProjectId?: string;
  onSelectProject: (projectId: string, project: Project) => void;
  onCreateProject?: () => void;
  placeholder?: string;
  className?: string;
}

const projectTypeLabels = {
  transcriptome: '转录组',
  'single-cell': '单细胞',
  genomics: '基因组',
  'multi-omics': '多组学',
};

const projectStatusLabels = {
  active: '进行中',
  completed: '已完成',
  paused: '暂停',
  archived: '已归档',
};

const projectStatusColors = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  paused: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-gray-100 text-gray-800',
};

export default function ProjectSelector({
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  placeholder = '选择项目...',
  className,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const { data, isLoading } = useProjects({
    search: searchValue || undefined,
    limit: 50,
  });

  const projects = data?.projects || [];
  const selectedProject = projects.find(p => p._id === selectedProjectId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedProject ? (
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4" />
              <span className="truncate">{selectedProject.name}</span>
              <Badge 
                variant="secondary" 
                className={cn("text-xs", projectStatusColors[selectedProject.status])}
              >
                {projectTypeLabels[selectedProject.type]}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="搜索项目..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {isLoading ? '加载中...' : '未找到项目'}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {projects.map((project) => (
              <CommandItem
                key={project._id}
                value={project._id}
                onSelect={() => {
                  onSelectProject(project._id, project);
                  setOpen(false);
                }}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center space-x-2">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProjectId === project._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <FolderOpen className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {project.description.length > 40 
                        ? project.description.substring(0, 40) + '...'
                        : project.description
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                  >
                    {projectTypeLabels[project.type]}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", projectStatusColors[project.status])}
                  >
                    {projectStatusLabels[project.status]}
                  </Badge>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          {onCreateProject && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onCreateProject();
                  setOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                创建新项目
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
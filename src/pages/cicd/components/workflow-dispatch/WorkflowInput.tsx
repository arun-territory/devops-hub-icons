
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { WorkflowDispatchInput } from "@/types/github";

interface WorkflowInputProps {
  name: string;
  input: WorkflowDispatchInput;
  value: string;
  onChange: (value: string) => void;
}

export const WorkflowInput = ({ name, input, value, onChange }: WorkflowInputProps) => {
  if ((input.type === 'choice' && input.options) || input.type === 'boolean') {
    let options = input.options;
    
    if (input.type === 'boolean') {
      options = ['true', 'false'];
    }
    
    if (!options && input.default) {
      options = [input.default];
    }

    return (
      <div className="space-y-2">
        <Label className="flex items-center text-sm font-medium">
          {input.description || name}
          {input.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${name}`} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
            {!options && input.default && (
              <SelectItem value={input.default}>
                {input.default}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (input.type === 'environment') {
    return (
      <div className="space-y-2">
        <Label className="flex items-center text-sm font-medium">
          {input.description || name}
          {input.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${name}`} />
          </SelectTrigger>
          <SelectContent>
            {input.default && (
              <SelectItem value={input.default}>
                {input.default}
              </SelectItem>
            )}
            {['production', 'staging', 'development'].map((env) => (
              <SelectItem key={env} value={env}>
                {env}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (input.type === 'number') {
    return (
      <div className="space-y-2">
        <Label className="flex items-center text-sm font-medium">
          {input.description || name}
          {input.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Input
          type="number"
          min={input.minimum}
          max={input.maximum}
          step={input.step || 1}
          placeholder={input.default || `Enter ${name}`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={input.required}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center text-sm font-medium">
        {input.description || name}
        {input.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type="text"
        placeholder={input.default || `Enter ${name}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={input.required}
      />
    </div>
  );
};

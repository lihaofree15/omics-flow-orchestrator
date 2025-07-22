import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ResourceChartProps {
  data: Array<{
    time: string;
    cpu: number;
    memory: number;
    storage: number;
  }>;
  type?: 'line' | 'area';
}

export function ResourceChart({ data, type = 'area' }: ResourceChartProps) {
  const Chart = type === 'line' ? LineChart : AreaChart;
  
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          {type === 'area' ? (
            <>
              <Area
                type="monotone"
                dataKey="cpu"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="memory"
                stackId="1"
                stroke="hsl(var(--success))"
                fill="hsl(var(--success))"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="storage"
                stackId="1"
                stroke="hsl(var(--warning))"
                fill="hsl(var(--warning))"
                fillOpacity={0.2}
              />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="storage"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={false}
              />
            </>
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
// frontend/src/components/interviewschedule/CalendarErrorBoundary.tsx

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CalendarErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Calendar Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-zinc-100 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800/50 p-6 shadow-xl">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
              日历渲染出错
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 mb-4">
              {this.state.error?.message || '未知错误'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-zinc-200 dark:bg-zinc-800 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

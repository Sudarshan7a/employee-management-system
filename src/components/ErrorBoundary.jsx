import { Component } from 'react';
import { AlertCircle } from 'lucide-react';
import { STORAGE_KEY } from '../data/seedEmployees.js';

export class DirectoryErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unexpected UI runtime error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Workspace Recovery Mode</span>
            </div>
            <p className="text-xs text-[#71717A] leading-relaxed">{this.state.errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }}
              className="px-3.5 py-2 text-xs font-medium bg-[#09090B] text-white rounded-md hover:bg-zinc-800"
            >
              Reset Local State & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

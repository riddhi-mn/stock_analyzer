import { ClipLoader } from 'react-spinners';

export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <ClipLoader />
      <p className="mt-2 text-gray-600">{message}</p>
    </div>
  );
}

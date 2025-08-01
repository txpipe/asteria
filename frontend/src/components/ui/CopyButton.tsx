import CopyIcon from '@/components/icons/CopyIcon';

export default function CopyButton({ text }: { text: string }) {
  const handleCopy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
      });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 text-primary-50 cursor-pointer text-sm"
    >
      <CopyIcon className="w-5 h-5" /> Copy
    </button>
  );
}

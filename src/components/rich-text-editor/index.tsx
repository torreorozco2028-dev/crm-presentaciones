'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Button, Tooltip } from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';

interface RichTextEditorProps {
  name: string;
  label?: string;
  defaultValue?: string | null;
  value: string;
  onChange: (html: string) => void;
}

type ToolbarButton = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof LucideIcon>['name'];
  isActive: () => boolean;
  run: () => void;
};

export default function RichTextEditor({
  name,
  label,
  defaultValue,
  value,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: defaultValue ?? '',
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class:
          'prose prose-zinc max-w-none min-h-[180px] px-3 py-2 focus:outline-none dark:prose-invert',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  if (!editor) {
    return (
      <div className='h-56 animate-pulse rounded-lg border border-default-200' />
    );
  }

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt(
      'Dirección del link (vacío para quitarlo)',
      previous
    );
    if (url === null) return;
    const chain = editor.chain().focus().extendMarkRange('link');
    if (url.trim() === '') chain.unsetLink().run();
    else chain.setLink({ href: url.trim() }).run();
  };

  const groups: ToolbarButton[][] = [
    [
      {
        key: 'h2',
        label: 'Título grande',
        icon: 'Heading2',
        isActive: () => editor.isActive('heading', { level: 2 }),
        run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        key: 'h3',
        label: 'Subtítulo',
        icon: 'Heading3',
        isActive: () => editor.isActive('heading', { level: 3 }),
        run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
    ],
    [
      {
        key: 'bold',
        label: 'Negrita',
        icon: 'Bold',
        isActive: () => editor.isActive('bold'),
        run: () => editor.chain().focus().toggleBold().run(),
      },
      {
        key: 'italic',
        label: 'Cursiva',
        icon: 'Italic',
        isActive: () => editor.isActive('italic'),
        run: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        key: 'underline',
        label: 'Subrayado',
        icon: 'Underline',
        isActive: () => editor.isActive('underline'),
        run: () => editor.chain().focus().toggleUnderline().run(),
      },
      {
        key: 'strike',
        label: 'Tachado',
        icon: 'Strikethrough',
        isActive: () => editor.isActive('strike'),
        run: () => editor.chain().focus().toggleStrike().run(),
      },
    ],
    [
      {
        key: 'bullets',
        label: 'Lista con viñetas',
        icon: 'List',
        isActive: () => editor.isActive('bulletList'),
        run: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        key: 'numbers',
        label: 'Lista numerada',
        icon: 'ListOrdered',
        isActive: () => editor.isActive('orderedList'),
        run: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        key: 'quote',
        label: 'Cita',
        icon: 'Quote',
        isActive: () => editor.isActive('blockquote'),
        run: () => editor.chain().focus().toggleBlockquote().run(),
      },
    ],
    [
      {
        key: 'left',
        label: 'Alinear a la izquierda',
        icon: 'AlignLeft',
        isActive: () => editor.isActive({ textAlign: 'left' }),
        run: () => editor.chain().focus().setTextAlign('left').run(),
      },
      {
        key: 'center',
        label: 'Centrar',
        icon: 'AlignCenter',
        isActive: () => editor.isActive({ textAlign: 'center' }),
        run: () => editor.chain().focus().setTextAlign('center').run(),
      },
      {
        key: 'right',
        label: 'Alinear a la derecha',
        icon: 'AlignRight',
        isActive: () => editor.isActive({ textAlign: 'right' }),
        run: () => editor.chain().focus().setTextAlign('right').run(),
      },
    ],
    [
      {
        key: 'link',
        label: 'Link',
        icon: 'Link',
        isActive: () => editor.isActive('link'),
        run: setLink,
      },
      {
        key: 'hr',
        label: 'Línea separadora',
        icon: 'Minus',
        isActive: () => false,
        run: () => editor.chain().focus().setHorizontalRule().run(),
      },
      {
        key: 'clear',
        label: 'Quitar formato',
        icon: 'RemoveFormatting',
        isActive: () => false,
        run: () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
      },
    ],
  ];

  return (
    <div className='space-y-1'>
      {label && (
        <p className='text-small font-semibold text-default-700'>{label}</p>
      )}
      <div className='rounded-lg border-2 border-default-200 focus-within:border-default-400'>
        <div className='flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-default-200 p-1.5'>
          {groups.map((group, gi) => (
            <div key={gi} className='flex items-center gap-0.5'>
              {gi > 0 && <span className='mx-1 h-5 w-px bg-default-200' />}
              {group.map((b) => (
                <Tooltip key={b.key} content={b.label} delay={400}>
                  <Button
                    isIconOnly
                    size='sm'
                    type='button'
                    variant={b.isActive() ? 'solid' : 'light'}
                    color={b.isActive() ? 'primary' : 'default'}
                    aria-label={b.label}
                    aria-pressed={b.isActive()}
                    onPress={b.run}
                  >
                    <LucideIcon name={b.icon} size='16' />
                  </Button>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
      <input type='hidden' name={name} value={value} />
    </div>
  );
}

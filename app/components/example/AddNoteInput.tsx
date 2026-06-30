import React, { useState } from 'react';
import PoppinsText from '../ui/text/PoppinsText';
import PoppinsTextInput from '../ui/forms/PoppinsTextInput';
import AppButton from '../ui/buttons/AppButton';
import Row from '../layout/Row';
import { useUserListSet } from 'hooks/useUserListSet';
import { generateId } from 'utils/generateId';
import { Note } from 'types/note';

interface AddNoteInputProps {
  userId: string;
}

/**
 * Imperatively upserts a new item into the per-user `notes` list. The list
 * renders itself elsewhere — this component only writes.
 */
const AddNoteInput = ({ userId }: AddNoteInputProps) => {
  const [text, setText] = useState('');
  const setNote = useUserListSet<Note>();

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed || !userId) return;

    const id = generateId();
    setNote({
      key: 'notes',
      itemId: id,
      value: { id, text: trimmed, createdAt: Date.now() },
      privacy: 'PRIVATE',
      searchKeys: ['text'],
      sortKey: 'PROPERTY_LAST_MODIFIED',
    });
    setText('');
  };

  return (
    <Row gap={2} className="w-full items-center">
      <PoppinsTextInput
        value={text}
        onChangeText={setText}
        placeholder="Write a note..."
        className="border-border bg-inner-background flex-1 rounded-xl border px-4 py-3"
        onSubmitEditing={handleAdd}
      />
      <AppButton variant="green" className="h-12 px-5" onPress={handleAdd}>
        <PoppinsText color="white" weight="bold">
          Add
        </PoppinsText>
      </AppButton>
    </Row>
  );
};

export default AddNoteInput;

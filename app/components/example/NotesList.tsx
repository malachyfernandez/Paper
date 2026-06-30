import React from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../ui/text/PoppinsText';
import AppButton from '../ui/buttons/AppButton';
import Row from '../layout/Row';
import Column from '../layout/Column';
import { useUserListGet } from 'hooks/useUserListGet';
import { useUserListRemove } from 'hooks/useUserListRemove';
import { Note } from 'types/note';

interface NotesListProps {
  userId: string;
}

/**
 * Reads the current user's `notes` list with `useUserListGet`. Re-renders
 * automatically whenever any note is added, edited, or removed anywhere.
 */
const NotesList = ({ userId }: NotesListProps) => {
  const records = useUserListGet<Note>({
    key: 'notes',
    userIds: userId ? [userId] : [],
  });
  const removeNote = useUserListRemove();

  if (!userId) return null;

  const notes = (records ?? [])
    .map((r) => r.value)
    .filter((n): n is Note => Boolean(n))
    .sort((a, b) => b.createdAt - a.createdAt);

  if (notes.length === 0) {
    return (
      <View className="border-subtle-border items-center rounded-2xl border border-dashed p-8">
        <PoppinsText varient="subtext">No notes yet — add your first one above.</PoppinsText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      <Column gap={2}>
        {notes.map((note) => (
          <Row
            key={note.id}
            gap={3}
            className="border-border bg-inner-background items-center rounded-xl border p-3">
            <PoppinsText className="flex-1">{note.text}</PoppinsText>
            <AppButton
              variant="outline"
              className="h-9 px-3"
              onPress={() => removeNote({ key: 'notes', itemId: note.id })}>
              <PoppinsText style={{ fontSize: 12 }}>Delete</PoppinsText>
            </AppButton>
          </Row>
        ))}
      </Column>
    </ScrollView>
  );
};

export default NotesList;

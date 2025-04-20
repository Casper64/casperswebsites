import java.util.stream.IntStream;

public class GapBuffer implements CharSequence {
    private final char[] buffer;
    private int gapStart;
    private int gapEnd;

    public GapBuffer(int capacity) {
        this.buffer = new char[capacity];
        this.gapStart = 0;
        this.gapEnd = capacity;
    }

    @Override
    public int length() {
        return buffer.length - (gapEnd - gapStart);
    }

    public boolean isFull() {
        return gapEnd == gapStart;
    }

    /**
     * @return the number of free characters in the gap buffer
     */
    public int gapSize() {
        return gapEnd - gapStart;
    }

    @Override
    public boolean isEmpty() {
        return gapStart == 0 && gapEnd == buffer.length;
    }

    @Override
    public char charAt(int index) {
        if (index < 0 || index >= length()) throw new IndexOutOfBoundsException();
        // check if the character is at the left or the right side of the gap
        return index < gapStart ? buffer[index] : buffer[index + (gapEnd - gapStart)];
    }

    /**
     * Insert a character at an index
     *
     * @param index insertion index
     * @param c     character
     * @return {@code true} if the insertion was successful and {@code false} if the gap buffer is full
     */
    public boolean insert(int index, char c) {
        if (index < 0 || index >= length()) throw new IndexOutOfBoundsException(index);
        if (isFull()) return false;

        moveGapTo(index);
        // insert single character
        buffer[gapStart++] = c;

        return true;
    }

    /**
     * Insert a {@link String}
     *
     * @param index insertion index
     * @param s     string to be inserted
     * @return {@code true} if the insertion was successful and {@code false} if {@code s.length()} is greater than
     * the gap size
     */
    public boolean insert(int index, String s) {
        if (index < 0 || index > length()) throw new IndexOutOfBoundsException(index);
        if (s.length() > gapSize()) return false;

        moveGapTo(index);
        // copy chars from the string into our buffer
        s.getChars(0, s.length(), buffer, gapStart);
        // update the start of the gap
        gapStart += s.length();

        return true;
    }

    public void delete(int start, int end) {
        if (start < 0 || end > length() || start > end) throw new IndexOutOfBoundsException();
        // don't actually remove the characters, just shift the gap
        moveGapTo(end);
        gapStart = start;
    }

    /**
     * Splits the gap buffer by removing the right half of the content
     *
     * @return a new gap buffer with the right half of the current content
     */
    public GapBuffer split() {
        int oldLength = length();
        int mid = oldLength / 2;
        moveGapTo(mid);

        GapBuffer right = new GapBuffer(buffer.length);
        // copy everything after the gap
        System.arraycopy(buffer, gapEnd, right.buffer, 0, oldLength - mid);
        // "delete" content after gapEnd
        gapEnd = buffer.length;
        // update gap start in the new buffer
        right.gapStart = oldLength - mid;

        return right;
    }

    /**
     * Merges a gap buffer into this gap buffer (insert it at the end)
     *
     * @param other
     */
    public void merge(GapBuffer other) {
        int otherLength = other.length();
        if (length() + otherLength > buffer.length) throw new IndexOutOfBoundsException();
        moveGapTo(length());

        // copy from left side of the gap
        System.arraycopy(other.buffer, 0, buffer, gapStart, other.gapStart);
        // copy from right side of the gap
        System.arraycopy(other.buffer, gapEnd, buffer, gapStart + other.gapStart, other.buffer.length - other.gapEnd);
        // update gap start
        gapStart += otherLength;
    }

    @Override
    public CharSequence subSequence(int start, int end) {
        if (start < 0 || end > length() || start > end) throw new IndexOutOfBoundsException();
        StringBuilder sb = new StringBuilder(end - start);

        if (end <= gapStart) {
            // we can get everything from the left side of the gap
            sb.append(buffer, start, end);
        } else if (start >= gapStart) {
            // copy everything from after gapEnd
            sb.append(buffer, gapEnd + (start - gapStart), end - start);
        } else {
            // we need to get the part from the left side of the gap and the rest from the right side
            int nLeft = gapStart - start;
            int nRight = (end - start) - nLeft;
            sb.append(buffer, start, nLeft);
            sb.append(buffer, gapEnd, nRight);
        }

        return sb;
    }

    /**
     * Move the gap so it's starts at {@code index}
     */
    private void moveGapTo(int index) {
        if (index < 0 || index > length()) throw new IndexOutOfBoundsException();

        if (index == gapStart) return;
        else if (index < gapStart) {
            int diff = gapStart - index;
            System.arraycopy(buffer, index, buffer, gapEnd - diff, diff);
        } else {
            int diff = index - gapStart;
            System.arraycopy(buffer, gapEnd, buffer, gapStart, diff);
        }

        // don't modify the gapEnd pointer when the buffer was previously full
        if (gapStart != gapEnd) gapEnd += (index - gapStart);
        gapStart = index;
    }

    @Override
    public String toString() {
        return subSequence(0, length()).toString();
    }

    @Override
    public IntStream chars() {
        return CharSequence.super.chars();
    }

    @Override
    public IntStream codePoints() {
        return CharSequence.super.codePoints();
    }

    public static void main(String[] args) {
        GapBuffer buffer = new GapBuffer(24);

        buffer.insert(0, "abcdefghi");
        buffer.delete(3, 3);

        System.out.println(buffer.subSequence(0, 2));
        System.out.println(buffer.subSequence(2, 4));
        System.out.println(buffer.subSequence(4, 6));

        System.out.println(buffer);

        GapBuffer buffer2 = buffer.split();
        System.out.println(buffer);
        System.out.println(buffer2);

        buffer2.merge(buffer);
        System.out.println(buffer2);

        GapBuffer buffer1 = new GapBuffer(6);
        buffer1.insert(0, "abc");
        GapBuffer buffer3 = new GapBuffer(6);
        buffer3.insert(0, "def");
        buffer1.merge(buffer3);
        System.out.println(buffer1);
    }
}

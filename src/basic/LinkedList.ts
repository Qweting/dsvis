// represents the element in the list and holds the reference to the next element
class Node<T> {
    element: T;
    next: Node<T> | null;

    // constructor
    constructor(element: T) {
        this.element = element;
        this.next = null;
    }
}

// linkedlist class
export default class LinkedList<T> {
    head: Node<T> | null;
    size: number;

    constructor() {
        this.head = null; // head will points to the first element of the list
        this.size = 0;
    }

    // adds the given element to the end of list
    insertBack(element: T) {
        // create a node for the new element
        const node = new Node(element);

        // if the list is empty, then the new element should become the head
        if (!this.head) {
            this.head = node;
        }
        // otherwise, traverse the list to find the last node and add the new element
        else {
            // to store current node
            let current = this.head;
            // iterate to the end of the list
            while (current.next) {
                current = current.next;
            }
            // add node
            current.next = node;
        }
        this.size++;
    }

    // adds the given element to the front of the list
    insertFront(element: T) {
        const node = new Node(element);
        node.next = this.head;
        this.head = node;
        this.size++;
    }

    // inserts the given element at the given index, returns true if successful
    insertAt(element: T, index: number): boolean {
        // check if the given index is valid
        if (index < 0 || index > this.size) {
            console.log("Invalid index.");
            return false;
        } else {
            // creates a new node
            const node = new Node(element);
            let current = this.head;
            let previous = null;

            // if index = 0, then the new element becomes the head
            if (index === 0) {
                node.next = this.head;
                this.head = node;
            } else {
                let counter = 0;
                // find the index for insertion
                while (counter < index) {
                    previous = current;
                    //if (!current) return false; // should never happen unless something is wrong
                    current = current!.next;
                    counter++;
                }

                // add the element and update the links
                node.next = current;
                previous!.next = node;
            }
            this.size++;
            return true;
        }
    }

    // removes the element in the given index and returns true if successful
    removeAt(index: number): boolean {
        if (index < 0 || index >= this.size) {
            console.log("Invalid index.");
            return false;
        } else {
            // if the index is 0, then the head is updated to the next element
            if (index === 0) {
                this.head = this.head!.next;
            } else {
                let counter = 0;
                let current = this.head;
                let previous = current;
                // find the index for deletion
                while (counter < index) {
                    counter++;
                    previous = current;
                    current = current!.next;
                }

                previous!.next = current!.next; // remove the element
            }
            this.size--;
            return true;
        }
    }

    // removes the given element from the list and returns true, if it is found then return false
    removeElement(element: T): boolean {
        let current = this.head;
        let prev = null;

        // find the element
        while (current != null) {
            // compare the given element with current element, if they match then remove the and return true
            if (current.element === element) {
                // if the element is the head, update the head to the next element
                if (prev == null) {
                    this.head = current.next;
                    // otherwise, update the previous nodes link to the next element
                } else {
                    prev.next = current.next;
                }
                this.size--;
                return true;
            }
            prev = current;
            current = current.next;
        }
        return false;
    }

    // returns the element at the given index
    get(index: number): T | null {
        if (index < 0 || index >= this.size) {
            console.log("Invalid index.");
        } else {
            let counter = 0;
            let current = this.head;

            // iterate over the list to find the index
            while (current != null) {
                if (counter === index) {
                    return current.element;
                }
                counter++;
                current = current.next;
            }
        }
        return null;
    }

    // finds the index of the given element, if it is not found then return null
    indexOf(element: T): number | null {
        let counter = 0;
        let current = this.head;

        // find the element
        while (current != null) {
            // compare the given element with current element, if they match then return the index
            if (current.element === element) {
                return counter;
            }
            counter++;
            current = current.next;
        }

        // not found
        return null;
    }

    // checks the list for empty
    isEmpty() {
        return this.size === 0;
    }

    //////////
    // Debugging methods
    //////////

    // gives the size of the list
    sizeOfList() {
        console.log(this.size);
    }

    // prints the lists elemtns
    printList() {
        let curr = this.head;
        let str = "";
        while (curr) {
            str += `${curr.element} `;
            curr = curr.next;
        }
        console.log(str);
    }
}

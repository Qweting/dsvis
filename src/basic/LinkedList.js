// represents the element in the list and holds the reference to the next element
class Node {
    // constructor
    constructor(element) {
        this.element = element;
        this.next = null
    }
}
// linkedlist class
class LinkedList {
    constructor() {
        // head will points to the first element of the list
        this.head = null;
        this.size = 0;
    }

    // adds the given element to the end of list
    add(element) {
        // create a node for the new element
        let node = new Node(element);
        // to store current node
        let current;
        // if the list is empty, then the new element should become the head
        if (this.head == null)
            this.head = node;
        // otherwise, traverse the list to find the last node and add the new element
        else {
            current = this.head;
            // iterate to the end of the list
            while (current.next) {
                current = current.next;
            }
            // add node
            current.next = node;
        }
        this.size++;
    }

    // inserts the given element at the given index
    insertAt(element, index) {
        // check if the given index is valid (if index = size, the element is added to the end of the list)
        if (index < 0 || index > this.size)
            return console.log("Invalid index.");
        else {
            // creates a new node
            let node = new Node(element);
            let curr, prev;

            curr = this.head;

            // if index = 0, then the new element becomes the head
            if (index == 0) {
                node.next = this.head;
                this.head = node;
            } else {
                curr = this.head;
                let i = 0;

                // find the index for insertion
                while (i < index) {
                    i++;
                    prev = curr;
                    curr = curr.next;
                }

                // add the element and update the links
                node.next = curr;
                prev.next = node;
            }
            this.size++;
        }
    }

    // removes the element in the given index and returns it
    removeFrom(index) {
        if (index < 0 || index >= this.size)
            return console.log("Invalid index.");
        else {
            let curr, prev, i = 0;
            curr = this.head;
            prev = curr;

            // if the index is 0, then the head is updated to the next element
            if (index === 0) {
                this.head = curr.next;
            } else {
                // find the index for deletion
                while (i < index) {
                    i++;
                    prev = curr;
                    curr = curr.next;
                }

                // remove the element
                prev.next = curr.next;
            }
            this.size--;

            // return the removed element
            return curr.element;
        }
    }

    // removes the given element from the list and returns true, if it is found then return false
    removeElement(element) {
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


    // finds the index of the given element, if it is not found then return -1
    indexOf(element) {
        let count = 0;
        let current = this.head;

        // find the element
        while (current != null) {
            // compare the given element with current element, if they match then return the index
            if (current.element === element)
                return count;
            count++;
            current = current.next;
        }

        // not found
        return -1;
    }

    // checks the list for empty
    isEmpty() {
        return this.size == 0;
    }

    // gives the size of the list
    size_of_list() {
        console.log(this.size);
    }


    // prints the lists elemtns
    printList() {
        let curr = this.head;
        let str = "";
        while (curr) {
            str += curr.element + " ";
            curr = curr.next;
        }
        console.log(str);
    }

}

// creating an object for the
// Linkedlist class
let ll = new LinkedList();

// testing isEmpty on an empty list
// returns true
console.log(ll.isEmpty());

// adding element to the list
ll.add(10);

// prints 10
ll.printList();

// returns 1
console.log(ll.size_of_list());

// adding more elements to the list
ll.add(20);
ll.add(30);
ll.add(40);
ll.add(50);

// returns 10 20 30 40 50
ll.printList();

// prints 50 from the list
console.log("is element removed ?" + ll.removeElement(50));

// prints 10 20 30 40
ll.printList();

// returns 3
console.log("Index of 40 " + ll.indexOf(40));

// insert 60 at second position
// ll contains 10 20 60 30 40
ll.insertAt(60, 2);

ll.printList();

// returns false
console.log("is List Empty ? " + ll.isEmpty());

// remove 3rd element from the list
console.log(ll.removeFrom(3));

// prints 10 20 60 40
ll.printList();
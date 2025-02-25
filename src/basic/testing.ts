import LinkedList from "./LinkedList"

// creating an object for the
// Linkedlist class
let ll = new LinkedList();

// testing isEmpty on an empty list
// returns true
console.log(ll.isEmpty());

// insertBacking element to the list
ll.insertBack(10);

// prints 10
ll.printList();

// returns 1
console.log(ll.size_of_list());

// insert more elements to the list
ll.insertBack(20);
ll.insertBack(30);
ll.insertBack(40);
ll.insertBack(50);

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
console.log(ll.removeAt(3));

// prints 10 20 60 40
ll.printList();
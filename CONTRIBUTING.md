# Design Philosophy

This project should be designed and implemented in a way that reduces side effects. Code functions should be well-defined and do as little as possible. This allows the entire system to be flexible, easily extendable, and hopefully easier to comprehend. (Please see the book "The Pragamatic Programmer" for more information.)

All effort should be made to reduce any repeated or similar code. Sections that cannot be reduced should have a comment to indicate why.

The design should attempt to be as simple and intutive as possible. The lack of these in different environments was the driving motivation for the creation of this project. All actions should be made as quick and easy as can be done.


## Unit Testing

All code should be unit testable. If not, something needs to be changed. 